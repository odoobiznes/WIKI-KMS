#!/bin/bash
# KMS Tools - Log Viewer
# Snadné sledování debug logů pro všechny KMS služby

echo "================================================================================"
echo "KMS TOOLS - LOG VIEWER"
echo "================================================================================"
echo ""
echo "Dostupné příkazy pro sledování logů:"
echo ""
echo "1. KMS API (hlavní backend):"
echo "   sudo journalctl -u kms-api.service -f"
echo ""
echo "2. Všechny KMS služby:"
echo "   sudo journalctl -u 'kms-*' -f"
echo ""
echo "3. Pouze chyby:"
echo "   sudo journalctl -u kms-api.service -p err -f"
echo ""
echo "4. Posledních 100 řádků:"
echo "   sudo journalctl -u kms-api.service -n 100 --no-pager"
echo ""
echo "5. Filtrování podle nástroje (např. Terminal):"
echo "   sudo journalctl -u kms-api.service | grep -i terminal"
echo ""
echo "6. Live monitoring všech tools:"
echo "   sudo journalctl -u kms-api.service -u kms-tools-ttyd -u kms-tools-filebrowser -u kms-tools-code-server -f"
echo ""
echo "================================================================================"
echo ""

# Nabídka interaktivního výběru
PS3="Vyber možnost (1-6 nebo 0 pro ukončení): "
options=("KMS API - Live logs" "Všechny KMS služby" "Pouze chyby" "Posledních 100 řádků" "Filtr Terminal" "Všechny tools live")

select opt in "${options[@]}"
do
    case $REPLY in
        1)
            echo "Spouštím: sudo journalctl -u kms-api.service -f"
            echo "Stiskni Ctrl+C pro ukončení"
            sleep 2
            sudo journalctl -u kms-api.service -f
            break
            ;;
        2)
            echo "Spouštím: sudo journalctl -u 'kms-*' -f"
            echo "Stiskni Ctrl+C pro ukončení"
            sleep 2
            sudo journalctl -u 'kms-*' -f
            break
            ;;
        3)
            echo "Spouštím: sudo journalctl -u kms-api.service -p err -f"
            echo "Stiskni Ctrl+C pro ukončení"
            sleep 2
            sudo journalctl -u kms-api.service -p err -f
            break
            ;;
        4)
            echo "Zobrazuji posledních 100 řádků..."
            sudo journalctl -u kms-api.service -n 100 --no-pager
            break
            ;;
        5)
            echo "Filtr pro Terminal..."
            sudo journalctl -u kms-api.service -n 200 --no-pager | grep -i terminal
            break
            ;;
        6)
            echo "Spouštím live monitoring všech tools..."
            echo "Stiskni Ctrl+C pro ukončení"
            sleep 2
            sudo journalctl -u kms-api.service -u kms-tools-ttyd -u kms-tools-filebrowser -u kms-tools-code-server -f
            break
            ;;
        0)
            echo "Ukončuji..."
            exit 0
            ;;
        *)
            echo "Neplatná volba: $REPLY"
            ;;
    esac
done
