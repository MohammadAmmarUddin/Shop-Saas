import Swal from 'sweetalert2';

export const toast = {
  success: (msg) => Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) => Swal.fire({ icon: 'error', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  info: (msg) => Swal.fire({ icon: 'info', title: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
};

export const confirmDelete = async (title = 'Delete item', message = 'This action cannot be undone.') => {
  const result = await Swal.fire({
    title, text: message, icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!', cancelButtonText: 'Cancel',
  });
  return result.isConfirmed;
};
