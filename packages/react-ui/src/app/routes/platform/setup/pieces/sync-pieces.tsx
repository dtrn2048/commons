import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { platformApi } from '@/lib/platforms-api'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

const SyncPiecesButton = () => {
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)

  const handleSyncPieces = async () => {
    setSyncing(true)
    try {
      await platformApi.syncPieces()
      toast({
        title: 'Success',
        description: 'Pieces synced successfully',
      })
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to sync pieces',
        variant: 'destructive',
      })
    }
    setSyncing(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSyncPieces}
      disabled={syncing}
    >
      <RefreshCw className={`size-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
      Sync Pieces
    </Button>
  )
}

SyncPiecesButton.displayName = 'SyncPiecesButton'
export { SyncPiecesButton }
