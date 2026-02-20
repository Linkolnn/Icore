import { ref, readonly } from 'vue'
import { useSocket } from './useSocket'

interface CallParticipant {
  userId: string
  name: string
  avatar?: string
  isMuted: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
  stream?: MediaStream
}

export function useWebRTC() {
  const localStream = ref<MediaStream | null>(null)
  const remoteStreams = ref<Map<string, MediaStream>>(new Map())
  const peerConnections = ref<Map<string, RTCPeerConnection>>(new Map())
  const participants = ref<Map<string, CallParticipant>>(new Map())
  
  const isInitialized = ref(false)
  const callId = ref<string>('')
  const isInCall = ref(false)
  const isMuted = ref(false)
  const isVideoOn = ref(false)
  const isScreenSharing = ref(false)
  
  // ICE servers config
  const iceServers = ref<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ])

  /**
   * Initialize local media stream
   */
  async function initializeMedia(constraints: MediaStreamConstraints = {
    audio: true,
    video: true
  }) {
    try {
      localStream.value = await navigator.mediaDevices.getUserMedia(constraints)
      isInitialized.value = true
      isVideoOn.value = constraints.video === true
      isMuted.value = false
      return localStream.value
    } catch (error) {
      console.error('Failed to get user media:', error)
      // Try audio only if video fails
      if (constraints.video) {
        return initializeMedia({ audio: true, video: false })
      }
      throw error
    }
  }

  /**
   * Create peer connection for a user
   */
  async function createPeerConnection(
    userId: string,
    isInitiator: boolean = false
  ): Promise<RTCPeerConnection> {
    const config: RTCConfiguration = {
      iceServers: iceServers.value
    }

    const pc = new RTCPeerConnection(config)

    // Add local stream tracks
    if (localStream.value) {
      localStream.value.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, localStream.value!)
      })
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        remoteStreams.value.set(userId, stream)
        
        // Update participant stream
        const participant = participants.value.get(userId)
        if (participant) {
          participant.stream = stream
        }
      }
    }

    // Handle ICE candidates
    const { emit } = useSocket()
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emit('call:ice-candidate', {
          callId: callId.value,
          targetUserId: userId,
          candidate: event.candidate
        })
      }
    }

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}: ${pc.connectionState}`)
      
      // Update participant status based on connection state
      const participant = participants.value.get(userId)
      if (participant) {
        if (pc.connectionState === 'connected') {
          // Participant connected
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          // Handle disconnection
          handleParticipantDisconnected(userId)
        }
      }
    }

    peerConnections.value.set(userId, pc)

    // Create offer if initiator
    if (isInitiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      // Send offer via WebSocket
      emit('call:offer', {
        callId: callId.value,
        targetUserId: userId,
        offer
      })
    }

    return pc
  }

  /**
   * Handle incoming offer
   */
  async function handleOffer(
    userId: string,
    offer: RTCSessionDescriptionInit
  ) {
    let pc = peerConnections.value.get(userId)
    
    if (!pc) {
      pc = await createPeerConnection(userId, false)
    }

    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    // Send answer via WebSocket
    const { emit } = useSocket()
    emit('call:answer', {
      callId: callId.value,
      targetUserId: userId,
      answer
    })
  }

  /**
   * Handle incoming answer
   */
  async function handleAnswer(
    userId: string,
    answer: RTCSessionDescriptionInit
  ) {
    const pc = peerConnections.value.get(userId)
    if (pc) {
      await pc.setRemoteDescription(answer)
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async function handleIceCandidate(
    userId: string,
    candidate: RTCIceCandidateInit
  ) {
    const pc = peerConnections.value.get(userId)
    if (pc) {
      await pc.addIceCandidate(candidate)
    }
  }

  /**
   * Toggle mute
   */
  function toggleAudio(enabled?: boolean) {
    const newState = enabled !== undefined ? enabled : !isMuted.value
    
    if (localStream.value) {
      localStream.value.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = newState
      })
    }
    
    isMuted.value = !newState
    
    // Notify others via WebSocket
    const { emit } = useSocket()
    if (isInCall.value) {
      emit('call:toggle-media', {
        callId: callId.value,
        type: 'audio',
        enabled: newState
      })
    }
  }

  /**
   * Toggle video
   */
  function toggleVideo(enabled?: boolean) {
    const newState = enabled !== undefined ? enabled : !isVideoOn.value
    
    if (localStream.value) {
      localStream.value.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = newState
      })
    }
    
    isVideoOn.value = newState
    
    // Notify others via WebSocket
    const { emit } = useSocket()
    if (isInCall.value) {
      emit('call:toggle-media', {
        callId: callId.value,
        type: 'video',
        enabled: newState
      })
    }
  }

  /**
   * Start screen share
   */
  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })

      // Replace video track
      const screenTrack = screenStream.getVideoTracks()[0]
      
      if (screenTrack) {
        peerConnections.value.forEach((pc: RTCPeerConnection) => {
          const sender = pc.getSenders().find(
            (s: RTCRtpSender) => s.track?.kind === 'video'
          )
          if (sender) {
            sender.replaceTrack(screenTrack)
          }
        })
        
        // Handle screen share end
        screenTrack.onended = () => {
          stopScreenShare()
        }
      }

      isScreenSharing.value = true

      // Notify others
      const { emit } = useSocket()
      if (isInCall.value) {
        emit('call:screen-share-start', {
          callId: callId.value
        })
      }

      return screenStream
    } catch (error) {
      console.error('Failed to start screen share:', error)
      throw error
    }
  }

  /**
   * Stop screen share
   */
  function stopScreenShare() {
    if (localStream.value && isScreenSharing.value) {
      const videoTrack = localStream.value.getVideoTracks()[0]
      
      peerConnections.value.forEach((pc: RTCPeerConnection) => {
        const sender = pc.getSenders().find(
          (s: RTCRtpSender) => s.track?.kind === 'video'
        )
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack)
        }
      })
    }

    isScreenSharing.value = false

    // Notify others
    const { emit } = useSocket()
    if (isInCall.value) {
      emit('call:screen-share-stop', {
        callId: callId.value
      })
    }
  }

  /**
   * Join a call
   */
  async function joinCall(
    newCallId: string,
    initialParticipants: CallParticipant[] = []
  ) {
    callId.value = newCallId
    isInCall.value = true

    // Add initial participants
    initialParticipants.forEach(p => {
      participants.value.set(p.userId, p)
    })

    // Initialize media if not already done
    if (!isInitialized.value) {
      await initializeMedia()
    }

    // Create peer connections for existing participants
    for (const participant of initialParticipants) {
      if (participant.userId !== getCurrentUserId()) {
        await createPeerConnection(participant.userId, true)
      }
    }
  }

  /**
   * Leave call
   */
  async function leaveCall() {
    // Stop local stream
    if (localStream.value) {
      localStream.value.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      localStream.value = null
    }

    // Close all peer connections
    peerConnections.value.forEach((pc: RTCPeerConnection) => pc.close())
    peerConnections.value.clear()

    // Clear remote streams
    remoteStreams.value.clear()

    // Clear participants
    participants.value.clear()

    isInitialized.value = false
    isInCall.value = false
    callId.value = ''
    isMuted.value = false
    isVideoOn.value = false
    isScreenSharing.value = false

    // Notify server
    const { emit } = useSocket()
    if (callId.value) {
      emit('call:leave', {
        callId: callId.value
      })
    }
  }

  /**
   * Handle participant joined
   */
  async function handleParticipantJoined(participant: CallParticipant) {
    participants.value.set(participant.userId, participant)
    
    // Create peer connection for new participant
    await createPeerConnection(participant.userId, true)
  }

  /**
   * Handle participant left
   */
  function handleParticipantLeft(userId: string) {
    // Close peer connection
    const pc = peerConnections.value.get(userId)
    if (pc) {
      pc.close()
      peerConnections.value.delete(userId)
    }

    // Remove streams
    remoteStreams.value.delete(userId)

    // Remove participant
    participants.value.delete(userId)
  }

  /**
   * Handle participant disconnected
   */
  function handleParticipantDisconnected(userId: string) {
    const participant = participants.value.get(userId)
    if (participant) {
      // Mark as disconnected but don't remove yet
      // They might reconnect
      console.log(`Participant ${userId} disconnected`)
    }
  }

  /**
   * Update participant media status
   */
  function updateParticipantMedia(
    userId: string,
    type: 'audio' | 'video',
    enabled: boolean
  ) {
    const participant = participants.value.get(userId)
    if (participant) {
      if (type === 'audio') {
        participant.isMuted = !enabled
      } else {
        participant.isVideoOn = enabled
      }
    }
  }

  /**
   * Get current user ID (helper)
   */
  function getCurrentUserId(): string {
    // TODO: Get from user store
    return 'current-user-id'
  }

  return {
    // State
    localStream: readonly(localStream),
    remoteStreams: readonly(remoteStreams),
    participants: readonly(participants),
    isInitialized: readonly(isInitialized),
    isInCall: readonly(isInCall),
    callId: readonly(callId),
    isMuted: readonly(isMuted),
    isVideoOn: readonly(isVideoOn),
    isScreenSharing: readonly(isScreenSharing),
    
    // Configuration
    iceServers,
    
    // Methods
    initializeMedia,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    joinCall,
    leaveCall,
    handleParticipantJoined,
    handleParticipantLeft,
    updateParticipantMedia
  }
}
