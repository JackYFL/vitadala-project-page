const siteHeader = document.querySelector('.site-header');
const navigation = document.getElementById('main-navigation');
if (siteHeader && navigation) {
  const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('main > section[id]'));
  let pendingFrame = false;
  let previousHeaderHeight = 0;

  function updateCurrentSection() {
    const headerHeight = Math.ceil(siteHeader.getBoundingClientRect().height);
    if (headerHeight !== previousHeaderHeight) {
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
      previousHeaderHeight = headerHeight;
    }
    const activationLine = headerHeight + Math.min(160, window.innerHeight * .2);
    let currentId = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= activationLine) currentId = section.id;
      else break;
    }
    if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2) {
      currentId = sections[sections.length - 1]?.id || currentId;
    }
    for (const link of links) {
      if (link.hash === `#${currentId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    pendingFrame = false;
  }

  function queueCurrentSectionUpdate() {
    if (!pendingFrame) {
      pendingFrame = true;
      window.requestAnimationFrame(updateCurrentSection);
    }
  }

  window.addEventListener('scroll', queueCurrentSectionUpdate, { passive: true });
  window.addEventListener('resize', queueCurrentSectionUpdate, { passive: true });
  window.addEventListener('hashchange', queueCurrentSectionUpdate);
  window.addEventListener('load', queueCurrentSectionUpdate);
  updateCurrentSection();
}

const copyButton = document.getElementById('copy-citation');
const citation = document.getElementById('bibtex');
const copyStatus = document.getElementById('copy-status');

if (copyButton && citation && copyStatus) {
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(citation.textContent.trim());
      copyStatus.textContent = 'Copied to clipboard';
    } catch {
      copyStatus.textContent = 'Select the citation above to copy it';
    }
    window.setTimeout(() => { copyStatus.textContent = ''; }, 3000);
  });
}
