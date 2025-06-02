import Swal from 'sweetalert2';

const useSweetAlert = () => {
  const showAlert = (title, text, icon, confirmButtonText) => {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonText,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        confirmButton: 'custom-swal-button',
      },
    });
  };

  const showConfirmation = (title, text, icon, confirmButtonText, cancelButtonText) => {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        confirmButton: 'custom-swal-button',
        cancelButton: 'custom-swal-button',
      },
    });
  };

  return { showAlert, showConfirmation };
};

export default useSweetAlert;