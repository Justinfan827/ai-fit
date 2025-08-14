"use client"

import { useState } from "react"
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
  YoutubeVideoPlayerContent,
} from "@/components/ui/kibo-ui/video-player"
import { cn } from "@/lib/utils"

interface YouTubeVideoProps {
  url: string
  className?: string
  title?: string
  /** Whether to use the enhanced video player instead of iframe fallback */
  useVideoPlayer?: boolean
}

// Define regex at top level for performance
const YOUTUBE_REGEX =
  /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/

const getYouTubeVideoId = (url: string): string | null => {
  const match = url.match(YOUTUBE_REGEX)
  return match && match[2].length === 11 ? match[2] : null
}

const isDirectVideoUrl = (url: string): boolean => {
  return url.includes(".mp4") || url.includes(".webm") || url.includes(".ogg")
}

const isYouTubeUrl = (url: string): boolean => {
  return YOUTUBE_REGEX.test(url)
}

// TODO: clean the fuck up.
export const YouTubeVideo = ({
  url,
  className,
  title,
  useVideoPlayer = true, // Default to true since we now support YouTube natively
}: YouTubeVideoProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const videoId = getYouTubeVideoId(url)

  // Enhanced video player for direct video URLs or YouTube URLs
  if (useVideoPlayer && (isDirectVideoUrl(url) || isYouTubeUrl(url))) {
    if (isYouTubeUrl(url)) {
      // Use YouTube video element for YouTube URLs
      if (!videoId) {
        return null
      }

      return (
        <VideoPlayer
          className={cn(
            "aspect-video w-full overflow-hidden rounded-lg border",
            className
          )}
        >
          <YoutubeVideoPlayerContent
            crossOrigin=""
            muted
            slot="media"
            src={url}
            video-id={videoId}
          />
          <VideoPlayerControlBar>
            <VideoPlayerPlayButton />
            <VideoPlayerSeekBackwardButton />
            <VideoPlayerSeekForwardButton />
            <VideoPlayerTimeRange />
            <VideoPlayerTimeDisplay showDuration />
            <VideoPlayerMuteButton />
            <VideoPlayerVolumeRange />
          </VideoPlayerControlBar>
        </VideoPlayer>
      )
    }

    // Use standard video element for direct video URLs
    return (
      <VideoPlayer
        className={cn(
          "aspect-video overflow-hidden rounded-lg border",
          className
        )}
      >
        <VideoPlayerContent
          crossOrigin=""
          muted
          preload="auto"
          slot="media"
          src={url}
          title={title || "Video"}
        />
        <VideoPlayerControlBar>
          <VideoPlayerPlayButton />
          <VideoPlayerSeekBackwardButton />
          <VideoPlayerSeekForwardButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>
    )
  }

  // Fallback to iframe for YouTube URLs when video player is disabled
  if (!videoId) {
    return null
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  // Fallback to iframe for YouTube URLs (since YouTube doesn't provide direct video URLs)
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100",
        className
      )}
    >
      {!isLoaded && (
        <button
          aria-label="Play video"
          className="absolute inset-0 bg-center bg-cover"
          onClick={() => setIsLoaded(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsLoaded(true)
            }
          }}
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
          type="button"
        >
          <div className="flex h-full items-center justify-center bg-black bg-opacity-30">
            <div className="rounded-full bg-red-600 p-3 transition-transform hover:scale-110">
              <svg
                aria-hidden="true"
                className="h-6 w-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Play</title>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
      {isLoaded && (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
          src={embedUrl}
          title={title || "YouTube video"}
        />
      )}
    </div>
  )
}
