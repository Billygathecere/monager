/**
 * Monager Toast Notification Utility
 * Non-blocking toast notifications that work seamlessly in iframes and all browsers.
 */

let toastTimeout = null;

export function showToast(message, type = 'info', duration = 3000) {
  if (typeof document === 'undefined') return;

  let toast = document.getElementById('app-global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-global-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 transition-all duration-300 font-mono text-xs max-w-sm pointer-events-none transform translate-y-4 opacity-0';
    document.body.appendChild(toast);
  }

  const bgColors = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-900/90 border-rose-500/50 text-rose-200',
    warning: 'bg-amber-900/90 border-amber-500/50 text-amber-200',
    info: 'bg-slate-900/90 border-white/20 text-white'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  const colorClass = bgColors[type] || bgColors.info;
  const icon = icons[type] || icons.info;

  toast.innerHTML = `
    <div class="px-4 py-3 rounded-2xl border ${colorClass} shadow-2xl backdrop-blur-md flex items-center gap-2.5">
      <span class="material-icons-outlined text-base">${icon}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Show
  toast.classList.remove('translate-y-4', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-4', 'opacity-0');
  }, duration);
}
