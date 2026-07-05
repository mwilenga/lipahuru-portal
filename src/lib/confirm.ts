import Swal from "sweetalert2";

const swalTheme = {
  background: "#111827",
  color: "#e2e8f0",
  confirmButtonColor: "#14b8a6",
  cancelButtonColor: "#334155",
};

export async function confirmLogout(): Promise<boolean> {
  const result = await Swal.fire({
    title: "Sign out?",
    text: "You will need to sign in again to continue.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, sign out",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    ...swalTheme,
  });

  return result.isConfirmed;
}
