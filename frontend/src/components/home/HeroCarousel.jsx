import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { HERO_SLIDES } from '../../data/heroSlides'
import { buttonClasses } from '../../utils/ui'

const INTERVAL_MS = 5000
const SWIPE_PX = 50

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function HeroCarousel({ slides = HERO_SLIDES }) {
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [hovering, setHovering] = useState(false)
  // Users who ask for reduced motion start paused; they can still press Play.
  const [userPaused, setUserPaused] = useState(reducedMotion)
  const touchX = useRef(null)

  const go = useCallback((i) => setIndex((i + count) % count), [count])
  const playing = !userPaused && !hovering && count > 1

  useEffect(() => {
    if (!playing) return undefined
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(t)
  }, [playing, count])

  if (count === 0) return null

  const onTouchEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) > SWIPE_PX) go(index + (dx < 0 ? 1 : -1))
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={onTouchEnd}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1)
        if (e.key === 'ArrowRight') go(index + 1)
      }}
    >
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live={playing ? 'off' : 'polite'}
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
            className={`relative flex h-56 w-full shrink-0 items-center bg-gradient-to-r px-6 text-white md:h-80 md:px-14 lg:h-96 ${s.bg}`}
          >
            {s.image && <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="relative max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/90">{s.eyebrow}</p>
              <h2 className="mt-1 text-3xl font-extrabold leading-tight md:text-5xl">{s.title}</h2>
              <p className="mt-2 text-white/95 md:text-lg">{s.text}</p>
              <Link
                to={s.to}
                tabIndex={i === index ? 0 : -1}
                className={`${buttonClasses('outline', 'lg')} mt-5 border-white`}
              >
                {s.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 md:flex">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 md:flex">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <button key={s.id} type="button" onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`} aria-current={i === index}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${i === index ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'}`} />
            ))}
            <button type="button" onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
              {userPaused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
