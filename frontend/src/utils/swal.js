import Swal from 'sweetalert2';

export const toast = {
  success: (msg) => Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) => Swal.fire({ icon: 'error', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  info: (msg) => Swal.fire({ icon: 'info', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
};

export const confirmAction = async ({ title = 'Confirm', text = 'Are you sure?', confirmText = 'Yes, proceed', cancelText = 'Cancel', icon = 'warning', confirmButtonColor = '#ef4444' } = {}) => {
  const result = await Swal.fire({
    title, text, icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};

export const showLoading = (title = 'Please wait...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
};

export const closeAlert = () => {
  if (Swal.isVisible()) Swal.close();
};
