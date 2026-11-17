import { Box, Link2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/shared/ui/ui";
import { buttonClass } from "@/shared/ui/styles";

const steps = [
  { icon: Link2, title: "Seu link exclusivo", text: "Cadastre-se e gere o link de cada empreendimento com o seu nome e o seu WhatsApp." },
  { icon: Box, title: "Showroom imersivo", text: "O cliente vê fotos, destaques e a maquete 3D direto no celular." },
  { icon: MessageCircle, title: "Quem reagiu, você vê", text: "Cada cliente chega na sua lista com o que abriu, e vocês conversam pelo chat ou WhatsApp." },
];

export function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <Link to="/entrar" className={buttonClass("ghost")}>
          Entrar
        </Link>
      </header>
      <section className="py-20">
        <h1 className="max-w-2xl text-4xl leading-tight text-forest sm:text-6xl">O showroom dos seus empreendimentos, no link do seu WhatsApp.</h1>
        <p className="mt-5 max-w-xl text-ink-muted">Lançamentos, decorados e maquetes 3D em uma página com a sua cara. Você envia, o cliente explora, e você sabe quem se interessou.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/cadastro" className={buttonClass()}>
            Sou corretor, quero meu link
          </Link>
          <Link to="/entrar" className={buttonClass("outline")}>
            Já tenho conta
          </Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-5">
            <Icon className="text-gold" />
            <h2 className="mt-3 text-xl text-forest">{title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
