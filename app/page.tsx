import LoginForm from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center h-dvh bg-gray-50 font-sans">
      <div className="w-full bg-white overflow-hidden flex h-full">

        {/* Lado Izquierdo: Visual / Branding — oculto en mobile/tablet */}
        <div className="hidden lg:flex w-full bg-linear-to-br from-[#1e517b] via-brand-primary to-[#16334b] p-16 flex-col justify-between text-white relative">

          {/* Logo */}
          <div className="size-9">
            <Image
              alt="logo isync web cloud"
              src="/assets/iSync.svg"
              height={80}
              width={80}
              className="object-contain"
            />
          </div>

          {/* Texto Principal */}
          <div className="relative z-10 mb-8 space-y-6">
            <h2 className="text-2xl font-medium text-blue-100">Todo Sincronizado</h2>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Obten acceso de manera mas rapida en cualquier dispositivo
            </h1>
          </div>

          {/* Decoración */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 opacity-20 rounded-full blur-[80px]"></div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="w-full bg-brand-primary md:bg-white lg:w-[60vw] flex flex-col justify-end md:justify-center p-0 lg:p-16">

          {/* Logo visible solo en mobile/tablet */}
          <div className="flex items-center flex-1 justify-center gap-2.5 md:mb-8 lg:hidden">
            <Image
              alt="logo isync"
              src="/assets/iSync.svg"
              priority
              height={36}
              width={36}
              className="object-contain size-50 md:size-9"
            />
            <span className="text-base font-bold text-gray-800 hidden md:block">iSync</span>
          </div>

          <div className="w-full max-w-full p-4 mx-auto lg:max-w-none bg-white h-[60vh] md:h-auto rounded-t-2xl">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}