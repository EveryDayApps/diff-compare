import { useCallback, useEffect, useRef, useState } from 'react'
import type { DataConnection, Peer as PeerType } from 'peerjs'
import type { DiffSettingsState } from '../components/DiffSettings'

export interface SharePayload {
  version: 1
  original: string
  modified: string
  originalFileName?: string
  modifiedFileName?: string
  diffSettings: DiffSettingsState
}

export type ShareState = 'idle' | 'waiting' | 'connected' | 'sent' | 'receiving' | 'received' | 'error'

interface UsePeerShareOptions {
  onReceive: (payload: SharePayload) => void
}

export function usePeerShare({ onReceive }: UsePeerShareOptions) {
  const [shareState, setShareState] = useState<ShareState>('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const peerRef = useRef<PeerType | null>(null)
  const connRef = useRef<DataConnection | null>(null)

  const stopSharing = useCallback(() => {
    connRef.current?.close()
    connRef.current = null
    peerRef.current?.destroy()
    peerRef.current = null
    setShareState('idle')
    setShareUrl(null)
    setErrorMessage(null)
  }, [])

  const startSharing = useCallback(async (payload: SharePayload) => {
    if (peerRef.current) stopSharing()

    const { Peer } = await import('peerjs')
    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', (id) => {
      const url = new URL(window.location.href)
      url.searchParams.set('share', id)
      setShareUrl(url.toString())
      setShareState('waiting')
    })

    peer.on('connection', (conn) => {
      connRef.current = conn
      setShareState('connected')

      conn.on('open', () => {
        conn.send(payload)
        setShareState('sent')
        setTimeout(() => stopSharing(), 3000)
      })

      conn.on('error', (err) => {
        setShareState('error')
        setErrorMessage((err as Error).message || 'Connection error')
      })
    })

    peer.on('error', (err: { type?: string; message?: string }) => {
      setShareState('error')
      setErrorMessage(
        err.type === 'unavailable-id'
          ? 'Peer ID unavailable, please try again.'
          : err.type === 'network'
          ? 'Network error. Check your connection.'
          : 'Sharing unavailable, try again.'
      )
    })
  }, [stopSharing])

  const connectToPeer = useCallback(async (peerId: string) => {
    const { Peer } = await import('peerjs')
    const peer = new Peer()
    peerRef.current = peer
    setShareState('receiving')

    peer.on('open', () => {
      const conn = peer.connect(peerId)
      connRef.current = conn

      conn.on('data', (data) => {
        onReceive(data as SharePayload)
        setShareState('received')
        const url = new URL(window.location.href)
        url.searchParams.delete('share')
        window.history.replaceState({}, '', url.toString())
        setTimeout(() => stopSharing(), 3000)
      })

      conn.on('error', (err) => {
        setShareState('error')
        setErrorMessage((err as Error).message || 'Failed to receive diff')
      })
    })

    peer.on('error', (err: { type?: string }) => {
      setShareState('error')
      setErrorMessage(
        err.type === 'peer-unavailable'
          ? 'Host disconnected or link expired.'
          : 'Connection failed. Try again.'
      )
    })
  }, [onReceive, stopSharing])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const peerId = params.get('share')
    if (peerId) connectToPeer(peerId)
    return () => stopSharing()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { shareState, shareUrl, startSharing, stopSharing, errorMessage }
}
