'use client'

import { useState } from 'react'
import { useDomains, useCreateDomain, useDeleteDomain } from '@it-enterprise/api-client'
import { useToastContext, SkeletonList, Input, Select, Button } from '@it-enterprise/ui'

export function DomainManager() {
  const { data: domains, isLoading } = useDomains()
  const createDomain = useCreateDomain()
  const deleteDomain = useDeleteDomain()
  const { success, error: showError } = useToastContext()
  const [subdomain, setSubdomain] = useState('')
  const [domain, setDomain] = useState('biznes.cz')
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createDomain.mutateAsync({ subdomain, domain })
      success(`Doména ${subdomain}.${domain} byla úspěšně vytvořena!`)
      setSubdomain('')
      setShowForm(false)
    } catch (error: any) {
      const errorMsg = error.error?.error || error.message || 'Chyba při vytváření domény'
      showError(errorMsg)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Opravdu chcete smazat tuto doménu?')) {
      try {
        await deleteDomain.mutateAsync(id)
        success('Doména byla úspěšně smazána')
      } catch (error: any) {
        const errorMsg = error.error?.error || error.message || 'Chyba při mazání domény'
        showError(errorMsg)
      }
    }
  }

  if (isLoading) {
    return <SkeletonList items={3} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Moje domény</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Zrušit' : '+ Nová doména'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <Input
            label="Subdoména"
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="jan-czech"
            required
            helperText="Pouze malá písmena, čísla a pomlčky"
          />
          <Select
            label="Doména"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            options={[
              { value: 'biznes.cz', label: 'biznes.cz' },
              { value: 'business.eu.com', label: 'business.eu.com' },
              { value: 'it-enterprise.cloud', label: 'it-enterprise.cloud' },
              { value: 'it-enterprise.pro', label: 'it-enterprise.pro' },
            ]}
          />
          <Button
            type="submit"
            isLoading={createDomain.isPending}
            className="w-full"
            size="lg"
          >
            Vytvořit doménu
          </Button>
        </form>
      )}

      {domains && domains.length > 0 ? (
        <div className="space-y-4">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold">{domain.fullDomain}</h3>
                <p className="text-sm text-gray-500">
                  Status: <span className="font-medium">{domain.status}</span>
                  {domain.sslEnabled && (
                    <span className="ml-2 text-green-600">🔒 SSL</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(domain.id)}
                className="text-red-600 hover:text-red-700 px-4 py-2"
              >
                Smazat
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Zatím nemáte žádné domény
        </div>
      )}
    </div>
  )
}

