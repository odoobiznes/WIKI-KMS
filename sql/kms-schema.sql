--
-- PostgreSQL database dump
--

\restrict bMf10VG7vKAU2xcexQ7BKRFiWqbX92GuVIUenkG4ENHO0VDt1WUYGGeaiQCL3GZ

-- Dumped from database version 16.11 (Ubuntu 16.11-1.pgdg24.04+1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: resource_status; Type: TYPE; Schema: public; Owner: kms_user
--

CREATE TYPE public.resource_status AS ENUM (
    'active',
    'reserved',
    'deprecated',
    'available',
    'conflict'
);


ALTER TYPE public.resource_status OWNER TO kms_user;

--
-- Name: resource_type; Type: TYPE; Schema: public; Owner: kms_user
--

CREATE TYPE public.resource_type AS ENUM (
    'port',
    'directory',
    'database',
    'db_user',
    'domain',
    'ssl_cert',
    'systemd',
    'nginx_conf',
    'api_key',
    'cron_job',
    'user',
    'env_var',
    'socket',
    'redis_db',
    'backup_path',
    'log_path',
    'secret',
    'other'
);


ALTER TYPE public.resource_type OWNER TO kms_user;

--
-- Name: allocate_resource(integer, public.resource_type, character varying, character varying, text); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.allocate_resource(p_project_id integer, p_type public.resource_type, p_name character varying, p_value character varying, p_description text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id INTEGER;
BEGIN
    -- Check availability
    IF NOT is_resource_available(p_type, p_value) THEN
        RAISE EXCEPTION 'Resource % of type % is already in use', p_value, p_type;
    END IF;

    -- Insert resource
    INSERT INTO resources (project_id, resource_type, name, value, description, status)
    VALUES (p_project_id, p_type, p_name, p_value, p_description, 'active')
    RETURNING id INTO new_id;

    -- Log history
    INSERT INTO resource_history (resource_id, action, new_value, reason)
    VALUES (new_id, 'created', p_value, 'Resource allocated');

    RETURN new_id;
END;
$$;


ALTER FUNCTION public.allocate_resource(p_project_id integer, p_type public.resource_type, p_name character varying, p_value character varying, p_description text) OWNER TO kms_user;

--
-- Name: FUNCTION allocate_resource(p_project_id integer, p_type public.resource_type, p_name character varying, p_value character varying, p_description text); Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON FUNCTION public.allocate_resource(p_project_id integer, p_type public.resource_type, p_name character varying, p_value character varying, p_description text) IS 'Allocate a new resource to a project';


--
-- Name: get_next_available_port(integer, integer); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.get_next_available_port(start_port integer DEFAULT 8100, end_port integer DEFAULT 9000) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    next_port INTEGER;
BEGIN
    SELECT port INTO next_port
    FROM v_available_ports
    WHERE port >= start_port AND port <= end_port
    LIMIT 1;

    RETURN next_port;
END;
$$;


ALTER FUNCTION public.get_next_available_port(start_port integer, end_port integer) OWNER TO kms_user;

--
-- Name: FUNCTION get_next_available_port(start_port integer, end_port integer); Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON FUNCTION public.get_next_available_port(start_port integer, end_port integer) IS 'Find next available port in a given range';


--
-- Name: get_object_hierarchy(uuid); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.get_object_hierarchy(object_uuid uuid) RETURNS TABLE(object_id integer, object_name character varying, category_name character varying, subcategory_name character varying, full_path text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name::VARCHAR,
        c.name::VARCHAR,
        sc.name::VARCHAR,
        (c.name ||
         COALESCE(' > ' || sc.name, '') ||
         ' > ' || o.name)::TEXT as full_path
    FROM objects o
    JOIN categories c ON o.category_id = c.id
    LEFT JOIN subcategories sc ON o.subcategory_id = sc.id
    WHERE o.uuid = object_uuid;
END;
$$;


ALTER FUNCTION public.get_object_hierarchy(object_uuid uuid) OWNER TO kms_user;

--
-- Name: is_resource_available(public.resource_type, character varying); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.is_resource_available(p_type public.resource_type, p_value character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM resources
        WHERE resource_type = p_type
          AND value = p_value
          AND status IN ('active', 'reserved')
    );
END;
$$;


ALTER FUNCTION public.is_resource_available(p_type public.resource_type, p_value character varying) OWNER TO kms_user;

--
-- Name: FUNCTION is_resource_available(p_type public.resource_type, p_value character varying); Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON FUNCTION public.is_resource_available(p_type public.resource_type, p_value character varying) IS 'Check if a resource value is available for allocation';


--
-- Name: log_entity_change(); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.log_entity_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_entity_type VARCHAR(50);
    v_entity_id INT;
    v_action VARCHAR(20);
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Determine entity type from table name
    v_entity_type := TG_TABLE_NAME;

    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_entity_id := NEW.id;
        v_new_data := row_to_json(NEW)::JSONB;
        v_old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_entity_id := NEW.id;
        v_old_data := row_to_json(OLD)::JSONB;
        v_new_data := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_entity_id := OLD.id;
        v_old_data := row_to_json(OLD)::JSONB;
        v_new_data := NULL;
    END IF;

    -- Insert change log entry
    INSERT INTO change_log (entity_type, entity_id, action, old_data, new_data, user_name)
    VALUES (v_entity_type, v_entity_id, v_action, v_old_data, v_new_data, CURRENT_USER);

    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.log_entity_change() OWNER TO kms_user;

--
-- Name: notify_change(); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.notify_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_payload TEXT;
BEGIN
    v_payload := json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'id', COALESCE(NEW.id, OLD.id)
    )::TEXT;

    PERFORM pg_notify('kms_changes', v_payload);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.notify_change() OWNER TO kms_user;

--
-- Name: release_resource(integer); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.release_resource(p_resource_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Log history before update
    INSERT INTO resource_history (resource_id, action, old_value, new_value, reason)
    SELECT id, 'released', value, value, 'Resource released'
    FROM resources WHERE id = p_resource_id;

    -- Mark as available
    UPDATE resources
    SET status = 'available', updated_at = NOW()
    WHERE id = p_resource_id;

    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.release_resource(p_resource_id integer) OWNER TO kms_user;

--
-- Name: FUNCTION release_resource(p_resource_id integer); Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON FUNCTION public.release_resource(p_resource_id integer) IS 'Release a resource back to available pool';


--
-- Name: search_documents(text); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.search_documents(search_query text) RETURNS TABLE(document_id integer, object_name character varying, folder character varying, filename character varying, rank real)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        o.name::VARCHAR,
        d.folder::VARCHAR,
        d.filename::VARCHAR,
        ts_rank(
            to_tsvector('english', COALESCE(d.content, '') || ' ' || d.filename),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM documents d
    JOIN objects o ON d.object_id = o.id
    WHERE to_tsvector('english', COALESCE(d.content, '') || ' ' || d.filename)
          @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC;
END;
$$;


ALTER FUNCTION public.search_documents(search_query text) OWNER TO kms_user;

--
-- Name: update_resources_timestamp(); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.update_resources_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_resources_timestamp() OWNER TO kms_user;

--
-- Name: update_sync_status_on_doc_change(); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.update_sync_status_on_doc_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update or insert sync status
    INSERT INTO sync_status (entity_type, entity_id, file_path, db_checksum, status, last_sync)
    VALUES ('documents', NEW.id, NEW.filepath, NEW.checksum, 'pending', NOW())
    ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET db_checksum = EXCLUDED.db_checksum,
        status = 'pending',
        updated_at = NOW();

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_sync_status_on_doc_change() OWNER TO kms_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: kms_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO kms_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(20) NOT NULL,
    icon character varying(50),
    color character varying(7),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT categories_type_check CHECK (((type)::text = ANY ((ARRAY['product'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.categories OWNER TO kms_user;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO kms_user;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: change_log; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.change_log (
    id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    action character varying(20) NOT NULL,
    user_name character varying(100),
    old_data jsonb,
    new_data jsonb,
    diff text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT change_log_action_check CHECK (((action)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'restore'::character varying])::text[])))
);


ALTER TABLE public.change_log OWNER TO kms_user;

--
-- Name: change_log_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.change_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.change_log_id_seq OWNER TO kms_user;

--
-- Name: change_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.change_log_id_seq OWNED BY public.change_log.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    object_id integer NOT NULL,
    folder character varying(50) NOT NULL,
    filename character varying(255) NOT NULL,
    filepath text NOT NULL,
    content text,
    content_type character varying(100),
    size_bytes bigint,
    checksum character varying(64),
    version integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO kms_user;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO kms_user;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: object_tags; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.object_tags (
    object_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.object_tags OWNER TO kms_user;

--
-- Name: objects; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.objects (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category_id integer NOT NULL,
    subcategory_id integer,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'draft'::character varying,
    author character varying(100),
    file_path text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT objects_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.objects OWNER TO kms_user;

--
-- Name: objects_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.objects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.objects_id_seq OWNER TO kms_user;

--
-- Name: objects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.objects_id_seq OWNED BY public.objects.id;


--
-- Name: port_ranges; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.port_ranges (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    start_port integer NOT NULL,
    end_port integer NOT NULL,
    purpose character varying(100),
    owner character varying(100),
    status public.resource_status DEFAULT 'active'::public.resource_status,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT valid_port_range CHECK (((start_port > 0) AND (end_port > start_port) AND (end_port < 65536)))
);


ALTER TABLE public.port_ranges OWNER TO kms_user;

--
-- Name: TABLE port_ranges; Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON TABLE public.port_ranges IS 'Predefined port ranges for different purposes';


--
-- Name: port_ranges_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.port_ranges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.port_ranges_id_seq OWNER TO kms_user;

--
-- Name: port_ranges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.port_ranges_id_seq OWNED BY public.port_ranges.id;


--
-- Name: resource_dependencies; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.resource_dependencies (
    id integer NOT NULL,
    resource_id integer,
    depends_on_id integer,
    dependency_type character varying(50) DEFAULT 'requires'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT no_self_dependency CHECK ((resource_id <> depends_on_id))
);


ALTER TABLE public.resource_dependencies OWNER TO kms_user;

--
-- Name: TABLE resource_dependencies; Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON TABLE public.resource_dependencies IS 'Dependencies between resources';


--
-- Name: resource_dependencies_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.resource_dependencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_dependencies_id_seq OWNER TO kms_user;

--
-- Name: resource_dependencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.resource_dependencies_id_seq OWNED BY public.resource_dependencies.id;


--
-- Name: resource_history; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.resource_history (
    id integer NOT NULL,
    resource_id integer,
    action character varying(50) NOT NULL,
    old_value text,
    new_value text,
    changed_by character varying(100) DEFAULT 'system'::character varying,
    reason text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.resource_history OWNER TO kms_user;

--
-- Name: TABLE resource_history; Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON TABLE public.resource_history IS 'Audit log of resource changes';


--
-- Name: resource_history_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.resource_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_history_id_seq OWNER TO kms_user;

--
-- Name: resource_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.resource_history_id_seq OWNED BY public.resource_history.id;


--
-- Name: resource_projects; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.resource_projects (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    kms_object_id integer,
    owner character varying(100) DEFAULT 'devops'::character varying,
    base_path character varying(500),
    status public.resource_status DEFAULT 'active'::public.resource_status,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.resource_projects OWNER TO kms_user;

--
-- Name: TABLE resource_projects; Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON TABLE public.resource_projects IS 'Projects that own resources, linked to KMS objects';


--
-- Name: resource_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.resource_projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_projects_id_seq OWNER TO kms_user;

--
-- Name: resource_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.resource_projects_id_seq OWNED BY public.resource_projects.id;


--
-- Name: resources; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    project_id integer,
    resource_type public.resource_type NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(500) NOT NULL,
    description text,
    status public.resource_status DEFAULT 'active'::public.resource_status,
    port_protocol character varying(10),
    port_binding character varying(50),
    path_type character varying(20),
    path_permissions character varying(10),
    db_cluster character varying(50),
    db_version character varying(20),
    service_unit character varying(100),
    service_user character varying(50),
    domain_ssl boolean DEFAULT false,
    domain_cert_path character varying(500),
    priority integer DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.resources OWNER TO kms_user;

--
-- Name: TABLE resources; Type: COMMENT; Schema: public; Owner: kms_user
--

COMMENT ON TABLE public.resources IS 'Central registry for all server resources (ports, directories, databases, etc.)';


--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resources_id_seq OWNER TO kms_user;

--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.subcategories (
    id integer NOT NULL,
    category_id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subcategories OWNER TO kms_user;

--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subcategories_id_seq OWNER TO kms_user;

--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.subcategories_id_seq OWNED BY public.subcategories.id;


--
-- Name: sync_status; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.sync_status (
    id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    file_path text,
    file_checksum character varying(64),
    db_checksum character varying(64),
    last_sync timestamp without time zone,
    sync_direction character varying(20),
    status character varying(20) DEFAULT 'synced'::character varying,
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT sync_status_status_check CHECK (((status)::text = ANY ((ARRAY['synced'::character varying, 'pending'::character varying, 'conflict'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.sync_status OWNER TO kms_user;

--
-- Name: sync_status_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.sync_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_status_id_seq OWNER TO kms_user;

--
-- Name: sync_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.sync_status_id_seq OWNED BY public.sync_status.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    color character varying(7),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tags OWNER TO kms_user;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO kms_user;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: templates; Type: TABLE; Schema: public; Owner: kms_user
--

CREATE TABLE public.templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category_id integer,
    folder character varying(50),
    template_content text NOT NULL,
    variables jsonb,
    is_global boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.templates OWNER TO kms_user;

--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: kms_user
--

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_id_seq OWNER TO kms_user;

--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kms_user
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: v_active_databases; Type: VIEW; Schema: public; Owner: kms_user
--

CREATE VIEW public.v_active_databases AS
 SELECT r.id,
    r.name,
    r.value AS database_name,
    r.db_cluster,
    r.db_version,
    p.name AS project_name,
    r.status
   FROM (public.resources r
     LEFT JOIN public.resource_projects p ON ((r.project_id = p.id)))
  WHERE ((r.resource_type = 'database'::public.resource_type) AND (r.status = 'active'::public.resource_status))
  ORDER BY r.value;


ALTER VIEW public.v_active_databases OWNER TO kms_user;

--
-- Name: v_active_directories; Type: VIEW; Schema: public; Owner: kms_user
--

CREATE VIEW public.v_active_directories AS
 SELECT r.id,
    r.name,
    r.value AS path,
    r.path_type,
    p.name AS project_name,
    r.status
   FROM (public.resources r
     LEFT JOIN public.resource_projects p ON ((r.project_id = p.id)))
  WHERE ((r.resource_type = 'directory'::public.resource_type) AND (r.status = 'active'::public.resource_status))
  ORDER BY r.value;


ALTER VIEW public.v_active_directories OWNER TO kms_user;

--
-- Name: v_active_ports; Type: VIEW; Schema: public; Owner: kms_user
--

CREATE VIEW public.v_active_ports AS
 SELECT r.id,
    r.name,
    (r.value)::integer AS port,
    r.port_protocol,
    r.port_binding,
    p.name AS project_name,
    r.status,
    r.description
   FROM (public.resources r
     LEFT JOIN public.resource_projects p ON ((r.project_id = p.id)))
  WHERE ((r.resource_type = 'port'::public.resource_type) AND (r.status = 'active'::public.resource_status))
  ORDER BY (r.value)::integer;


ALTER VIEW public.v_active_ports OWNER TO kms_user;

--
-- Name: v_available_ports; Type: VIEW; Schema: public; Owner: kms_user
--

CREATE VIEW public.v_available_ports AS
 WITH used_ports AS (
         SELECT (resources.value)::integer AS port
           FROM public.resources
          WHERE ((resources.resource_type = 'port'::public.resource_type) AND (resources.status = 'active'::public.resource_status))
        ), port_series AS (
         SELECT generate_series(1024, 65535) AS port
        )
 SELECT port
   FROM port_series
  WHERE ((NOT (port IN ( SELECT used_ports.port
           FROM used_ports))) AND (port <> ALL (ARRAY[1024, 3306, 5432, 5433, 6379, 11211, 22, 80, 443])))
  ORDER BY port
 LIMIT 100;


ALTER VIEW public.v_available_ports OWNER TO kms_user;

--
-- Name: v_documents_search; Type: VIEW; Schema: public; Owner: kms_user
--

CREATE VIEW public.v_documents_search AS
 SELECT d.id,
    d.object_id,
    d.folder,
    d.filename,
    d.filepath,
    d.content_type,
    d.size_bytes,
    o.name AS object_name,
    c.name AS category_name,
    sc.name AS subcategory_name,
    d.created_at,
    d.updated_at,
    to_tsvector('english'::regconfig, COALESCE(d.content, ''::text)) AS content_vector,
    to_tsvector('english'::regconfig, (d.filename)::text) AS filename_vector
   FROM (((public.documents d
     JOIN public.objects o ON ((d.object_id = o.id)))
     JOIN public.categories c ON ((o.category_id = c.id)))
     LEFT JOIN public.subcategories sc ON ((o.subcategory_id = sc.id)));


ALTER VIEW public.v_documents_search OWNER TO kms_user;

--
-- Name: v_objects_full; Type: VIEW; Schema: public; Owner: kms_user
--

CREATE VIEW public.v_objects_full AS
 SELECT o.id,
    o.uuid,
    o.slug AS object_slug,
    o.name AS object_name,
    o.description,
    o.status,
    o.author,
    o.file_path,
    o.metadata,
    c.id AS category_id,
    c.slug AS category_slug,
    c.name AS category_name,
    c.type AS category_type,
    sc.id AS subcategory_id,
    sc.slug AS subcategory_slug,
    sc.name AS subcategory_name,
    array_agg(DISTINCT t.name) FILTER (WHERE (t.name IS NOT NULL)) AS tags,
    o.created_at,
    o.updated_at
   FROM ((((public.objects o
     JOIN public.categories c ON ((o.category_id = c.id)))
     LEFT JOIN public.subcategories sc ON ((o.subcategory_id = sc.id)))
     LEFT JOIN public.object_tags ot ON ((o.id = ot.object_id)))
     LEFT JOIN public.tags t ON ((ot.tag_id = t.id)))
  GROUP BY o.id, o.uuid, o.slug, o.name, o.description, o.status, o.author, o.file_path, o.metadata, c.id, c.slug, c.name, c.type, sc.id, sc.slug, sc.name, o.created_at, o.updated_at;


ALTER VIEW public.v_objects_full OWNER TO kms_user;

--
-- Name: v_project_resources; Type: VIEW; Schema: public; Owner: kms_user
--

CREATE VIEW public.v_project_resources AS
 SELECT p.id AS project_id,
    p.name AS project_name,
    p.slug,
    p.status AS project_status,
    count(r.id) AS total_resources,
    count(
        CASE
            WHEN (r.resource_type = 'port'::public.resource_type) THEN 1
            ELSE NULL::integer
        END) AS ports,
    count(
        CASE
            WHEN (r.resource_type = 'directory'::public.resource_type) THEN 1
            ELSE NULL::integer
        END) AS directories,
    count(
        CASE
            WHEN (r.resource_type = 'database'::public.resource_type) THEN 1
            ELSE NULL::integer
        END) AS databases,
    count(
        CASE
            WHEN (r.resource_type = 'systemd'::public.resource_type) THEN 1
            ELSE NULL::integer
        END) AS services
   FROM (public.resource_projects p
     LEFT JOIN public.resources r ON (((p.id = r.project_id) AND (r.status = 'active'::public.resource_status))))
  GROUP BY p.id, p.name, p.slug, p.status
  ORDER BY p.name;


ALTER VIEW public.v_project_resources OWNER TO kms_user;

--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: change_log id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.change_log ALTER COLUMN id SET DEFAULT nextval('public.change_log_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: objects id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.objects ALTER COLUMN id SET DEFAULT nextval('public.objects_id_seq'::regclass);


--
-- Name: port_ranges id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.port_ranges ALTER COLUMN id SET DEFAULT nextval('public.port_ranges_id_seq'::regclass);


--
-- Name: resource_dependencies id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_dependencies ALTER COLUMN id SET DEFAULT nextval('public.resource_dependencies_id_seq'::regclass);


--
-- Name: resource_history id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_history ALTER COLUMN id SET DEFAULT nextval('public.resource_history_id_seq'::regclass);


--
-- Name: resource_projects id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_projects ALTER COLUMN id SET DEFAULT nextval('public.resource_projects_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.subcategories ALTER COLUMN id SET DEFAULT nextval('public.subcategories_id_seq'::regclass);


--
-- Name: sync_status id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.sync_status ALTER COLUMN id SET DEFAULT nextval('public.sync_status_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: change_log change_log_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.change_log
    ADD CONSTRAINT change_log_pkey PRIMARY KEY (id);


--
-- Name: documents documents_object_id_folder_filename_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_object_id_folder_filename_key UNIQUE (object_id, folder, filename);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: object_tags object_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.object_tags
    ADD CONSTRAINT object_tags_pkey PRIMARY KEY (object_id, tag_id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: objects objects_uuid_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_uuid_key UNIQUE (uuid);


--
-- Name: port_ranges port_ranges_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.port_ranges
    ADD CONSTRAINT port_ranges_pkey PRIMARY KEY (id);


--
-- Name: resource_dependencies resource_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_dependencies
    ADD CONSTRAINT resource_dependencies_pkey PRIMARY KEY (id);


--
-- Name: resource_history resource_history_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_history
    ADD CONSTRAINT resource_history_pkey PRIMARY KEY (id);


--
-- Name: resource_projects resource_projects_name_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_projects
    ADD CONSTRAINT resource_projects_name_key UNIQUE (name);


--
-- Name: resource_projects resource_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_projects
    ADD CONSTRAINT resource_projects_pkey PRIMARY KEY (id);


--
-- Name: resource_projects resource_projects_slug_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_projects
    ADD CONSTRAINT resource_projects_slug_key UNIQUE (slug);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_category_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_slug_key UNIQUE (category_id, slug);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: sync_status sync_status_entity_type_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_entity_type_entity_id_key UNIQUE (entity_type, entity_id);


--
-- Name: sync_status sync_status_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: resource_dependencies unique_dependency; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_dependencies
    ADD CONSTRAINT unique_dependency UNIQUE (resource_id, depends_on_id);


--
-- Name: resources unique_resource_value; Type: CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT unique_resource_value UNIQUE (resource_type, value);


--
-- Name: idx_change_log_created; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_change_log_created ON public.change_log USING btree (created_at DESC);


--
-- Name: idx_change_log_entity; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_change_log_entity ON public.change_log USING btree (entity_type, entity_id);


--
-- Name: idx_documents_checksum; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_documents_checksum ON public.documents USING btree (checksum);


--
-- Name: idx_documents_content_fts; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_documents_content_fts ON public.documents USING gin (to_tsvector('english'::regconfig, COALESCE(content, ''::text)));


--
-- Name: idx_documents_filename_fts; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_documents_filename_fts ON public.documents USING gin (to_tsvector('english'::regconfig, (filename)::text));


--
-- Name: idx_documents_folder; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_documents_folder ON public.documents USING btree (folder);


--
-- Name: idx_documents_object; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_documents_object ON public.documents USING btree (object_id);


--
-- Name: idx_objects_category; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_objects_category ON public.objects USING btree (category_id);


--
-- Name: idx_objects_status; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_objects_status ON public.objects USING btree (status);


--
-- Name: idx_objects_subcategory; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_objects_subcategory ON public.objects USING btree (subcategory_id);


--
-- Name: idx_objects_unique; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE UNIQUE INDEX idx_objects_unique ON public.objects USING btree (category_id, COALESCE(subcategory_id, 0), slug);


--
-- Name: idx_objects_uuid; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_objects_uuid ON public.objects USING btree (uuid);


--
-- Name: idx_resource_history_resource; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_resource_history_resource ON public.resource_history USING btree (resource_id);


--
-- Name: idx_resource_projects_kms; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_resource_projects_kms ON public.resource_projects USING btree (kms_object_id);


--
-- Name: idx_resources_project; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_resources_project ON public.resources USING btree (project_id);


--
-- Name: idx_resources_status; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_resources_status ON public.resources USING btree (status);


--
-- Name: idx_resources_type; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_resources_type ON public.resources USING btree (resource_type);


--
-- Name: idx_resources_value; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_resources_value ON public.resources USING btree (value);


--
-- Name: idx_sync_status_entity; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_sync_status_entity ON public.sync_status USING btree (entity_type, entity_id);


--
-- Name: idx_sync_status_status; Type: INDEX; Schema: public; Owner: kms_user
--

CREATE INDEX idx_sync_status_status ON public.sync_status USING btree (status);


--
-- Name: categories log_categories_changes; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER log_categories_changes AFTER INSERT OR DELETE OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();


--
-- Name: documents log_documents_changes; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER log_documents_changes AFTER INSERT OR DELETE OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();


--
-- Name: objects log_objects_changes; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER log_objects_changes AFTER INSERT OR DELETE OR UPDATE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();


--
-- Name: subcategories log_subcategories_changes; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER log_subcategories_changes AFTER INSERT OR DELETE OR UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();


--
-- Name: documents notify_documents_change; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER notify_documents_change AFTER INSERT OR DELETE OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.notify_change();


--
-- Name: objects notify_objects_change; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER notify_objects_change AFTER INSERT OR DELETE OR UPDATE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.notify_change();


--
-- Name: resource_projects trigger_projects_timestamp; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER trigger_projects_timestamp BEFORE UPDATE ON public.resource_projects FOR EACH ROW EXECUTE FUNCTION public.update_resources_timestamp();


--
-- Name: resources trigger_resources_timestamp; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER trigger_resources_timestamp BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_resources_timestamp();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON public.objects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subcategories update_subcategories_updated_at; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_sync_status_documents; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER update_sync_status_documents AFTER INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_sync_status_on_doc_change();


--
-- Name: sync_status update_sync_status_updated_at; Type: TRIGGER; Schema: public; Owner: kms_user
--

CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON public.sync_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents documents_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;


--
-- Name: object_tags object_tags_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.object_tags
    ADD CONSTRAINT object_tags_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;


--
-- Name: object_tags object_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.object_tags
    ADD CONSTRAINT object_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: objects objects_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: objects objects_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.objects
    ADD CONSTRAINT objects_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE SET NULL;


--
-- Name: resource_dependencies resource_dependencies_depends_on_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_dependencies
    ADD CONSTRAINT resource_dependencies_depends_on_id_fkey FOREIGN KEY (depends_on_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- Name: resource_dependencies resource_dependencies_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_dependencies
    ADD CONSTRAINT resource_dependencies_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- Name: resource_history resource_history_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_history
    ADD CONSTRAINT resource_history_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE SET NULL;


--
-- Name: resource_projects resource_projects_kms_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resource_projects
    ADD CONSTRAINT resource_projects_kms_object_id_fkey FOREIGN KEY (kms_object_id) REFERENCES public.objects(id) ON DELETE SET NULL;


--
-- Name: resources resources_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.resource_projects(id) ON DELETE CASCADE;


--
-- Name: subcategories subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: templates templates_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kms_user
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO kms_user;


--
-- PostgreSQL database dump complete
--

\unrestrict bMf10VG7vKAU2xcexQ7BKRFiWqbX92GuVIUenkG4ENHO0VDt1WUYGGeaiQCL3GZ
