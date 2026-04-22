document.addEventListener('DOMContentLoaded', function() {
  const wrapper = document.querySelector('.terminal-wrapper');
  if (!wrapper) return;

  wrapper.classList.add('loaded');

  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http')) {
        this.style.opacity = '0.7';
      }
    });
  });

  const copyButtons = document.querySelectorAll('.copy-button');
  copyButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const codeBlock = this.closest('.code-wrapper') || this.parentElement;
      const code = codeBlock.querySelector('code');
      try {
        await navigator.clipboard.writeText(code.textContent);
        this.textContent = 'copied!';
        setTimeout(() => {
          this.textContent = 'copy';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  });
});