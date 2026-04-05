// ===== Smooth Scroll =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute('href'))
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

// ===== Navbar Scroll Effect =====
const nav = document.querySelector('.nav')
window.addEventListener('scroll', () => {
  if (nav) {
    nav.style.background = window.pageYOffset > 50 ? 'rgba(9, 9, 11, 0.95)' : 'rgba(9, 9, 11, 0.8)'
  }
})

// ===== Intersection Observer for Animations =====
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 }
const animateOnScroll = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1'
      entry.target.style.transform = 'translateY(0)'
    }
  })
}, observerOptions)

document.querySelectorAll('.feature, .usecase, .section-intro').forEach((el, i) => {
  el.style.opacity = '0'
  el.style.transform = 'translateY(30px)'
  el.style.transition = `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`
  animateOnScroll.observe(el)
})

// ===== Video Placeholder Click Handler =====
document.querySelectorAll('.video-placeholder').forEach((placeholder) => {
  placeholder.addEventListener('click', () => {
    // Placeholder for video loading logic
    // When you add actual video files, this can trigger video playback
    console.log('Video placeholder clicked - add your video file')
  })
})

// ===== Button Hover Effects =====
document.querySelectorAll('.btn-primary, .btn-ghost').forEach((button) => {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)'
  })
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)'
  })
})

// ===== Console Branding =====
console.log(
  '%c Go Atlas ',
  'background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; font-size: 24px; padding: 10px 20px; border-radius: 8px; font-weight: bold;'
)
console.log('%c Animate Maps Like Never Before ', 'color: #a1a1aa; font-size: 14px;')
