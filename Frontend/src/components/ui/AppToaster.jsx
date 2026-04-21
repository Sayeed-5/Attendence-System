import { CheckCircle, Info, WarningCircle, XCircle } from "@phosphor-icons/react";
import { Toaster, ToastBar } from "react-hot-toast";

function iconForToast(type) {
  if (type === "success") return <CheckCircle size={20} weight="fill" className="text-emerald-300" />;
  if (type === "error") return <XCircle size={20} weight="fill" className="text-rose-300" />;
  if (type === "loading") return <Info size={20} className="text-sky-300" />;
  return <WarningCircle size={20} className="text-slate-300" />;
}

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={14}
      toastOptions={{
        duration: 3600,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
        },
      }}
    >
      {(toast) => (
        <ToastBar toast={toast}>
          {({ message }) => (
            <div className="flex w-[min(92vw,380px)] items-start gap-3 rounded-[22px] border border-white/8 bg-[#141a26]/96 px-4 py-4 text-slate-100 shadow-[0_22px_50px_rgba(0,0,0,0.36)] backdrop-blur-xl">
              <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                {iconForToast(toast.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {toast.type === "success"
                    ? "Action completed"
                    : toast.type === "error"
                      ? "Something went wrong"
                      : "Update"}
                </p>
                <div className="mt-1 text-sm text-slate-300">{message}</div>
              </div>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
