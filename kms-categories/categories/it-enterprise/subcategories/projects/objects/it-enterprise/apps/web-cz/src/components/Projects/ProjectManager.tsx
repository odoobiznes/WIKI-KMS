'use client'

import { useState } from 'react'
import { useProjects, useCreateProject, usePublishProject } from '@it-enterprise/api-client'
import { useToastContext, SkeletonList, Input, Select, Button } from '@it-enterprise/ui'

export function ProjectManager() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const publishProject = usePublishProject()
  const { success, error: showError } = useToastContext()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [tool, setTool] = useState<'WINDSURF' | 'LOVABLE' | 'ONESPACE' | 'CURSOR'>('WINDSURF')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProject.mutateAsync({ name, tool })
      success(`Projekt "${name}" byl úspěšně vytvořen!`)
      setName('')
      setShowForm(false)
    } catch (error: any) {
      const errorMsg = error.error?.error || error.message || 'Chyba při vytváření projektu'
      showError(errorMsg)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await publishProject.mutateAsync(id)
      success('Projekt byl úspěšně publikován!')
    } catch (error: any) {
      const errorMsg = error.error?.error || error.message || 'Chyba při publikaci projektu'
      showError(errorMsg)
    }
  }

  const getToolLabel = (tool: string) => {
    const labels: Record<string, string> = {
      WINDSURF: 'Windsurf',
      LOVABLE: 'Lovable',
      ONESPACE: 'OneSpace',
      CURSOR: 'Cursor'
    }
    return labels[tool] || tool
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      BUILDING: 'bg-yellow-100 text-yellow-800',
      READY: 'bg-blue-100 text-blue-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ERROR: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <SkeletonList items={3} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Moje projekty</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Zrušit' : '+ Nový projekt'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <Input
            label="Název projektu"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Můj web"
            required
          />
          <Select
            label="AI Platforma"
            value={tool}
            onChange={(e) => setTool(e.target.value as any)}
            options={[
              { value: 'WINDSURF', label: 'Windsurf' },
              { value: 'LOVABLE', label: 'Lovable' },
              { value: 'ONESPACE', label: 'OneSpace' },
              { value: 'CURSOR', label: 'Cursor' },
            ]}
          />
          <Button
            type="submit"
            isLoading={createProject.isPending}
            className="w-full"
            size="lg"
          >
            Vytvořit projekt
          </Button>
        </form>
      )}

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Platforma: <span className="font-medium">{getToolLabel(project.tool)}</span>
              </p>
              <div className="flex gap-2">
                {project.status === 'READY' && !project.published && (
                  <button
                    onClick={() => handlePublish(project.id)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Publikovat
                  </button>
                )}
                {project.published && (
                  <span className="text-green-600 text-sm font-medium">✓ Publikováno</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Zatím nemáte žádné projekty
        </div>
      )}
    </div>
  )
}

