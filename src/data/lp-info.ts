const message = 'Olá, tudo bem? Tenho um projeto em mente e queria conversar com você.'
const encodedMessage = encodeURIComponent(message)
const link = `https://wa.me/5519996391410?text=${encodedMessage}`

export const contactContent = {
  whatsapp: link,
}

export const navbarContent = {
  logo: {
    alt: 'Giovanni Cruz',
    text: 'giovannicruz.dev',
    href: '/',
  },
  navLinks: [
    { label: 'Serviços', href: '#services' },
    { label: 'Sobre', href: '#about' },
    { label: 'Contato', href: contactContent.whatsapp },
  ],
}

export const heroContent = {
  words: ['sites', 'sistemas', 'landing pages', 'presença digital', 'resultados'],
  mainTitle: {
    line1: 'Eu faço',
    line2: 'que trabalham por você.',
  },
  subtitle: 'Do código ao suporte. Um parceiro fixo pro seu negócio.',
}

export const problemsContent = {
  sectionLabel: 'O Problema',
  cards: [
    {
      text: 'Você pagou por um site. Recebeu um link e um "qualquer coisa me chama" que nunca mais foi atendido.',
    },
    {
      text: 'Você fica com um site que ninguém mantém, ninguém melhora e ninguém atende quando algo para de funcionar.',
    },
    {
      text: 'Eu sou o oposto disso.',
      subtext: 'Presença constante. Do primeiro dia em diante.',
    },
  ],
}

export const servicesContent = {
  sectionLabel: 'Serviços',
  title: 'Tudo que seu negócio precisa pra existir de verdade na internet.',
  services: [
    {
      id: '01',
      title: 'Websites',
      description:
        'Sites autorais, feitos à mão como obra de arte, sem template genérico. Num mundo em que a IA deixou tudo genérico e igual, o seu nasce único: com identidade, alma e uma estética que é só sua. Arte que converte.',
    },
    {
      id: '02',
      title: 'Sistemas',
      description:
        'Software sob medida para o jeito que o seu negócio funciona de verdade. De uma automação pontual a uma plataforma que roda a operação inteira. Se dá pra imaginar, dá pra construir: ferramentas que acabam com o trabalho manual e crescem junto com você.',
    },
    {
      id: '03',
      title: 'E-commerce',
      description: 'Lojas virtuais com checkout otimizado, gestão de produtos e integração com meios de pagamento.',
    },

  ],
}

export const aboutContent = {
  sectionLabel: 'Sobre',
  title: {
    line1: 'Sou Giovanni Cruz.',
    line2: 'Desenvolvedor de software.',
  },
  description: [
    'Trabalho com desenvolvimento de software desde 2021. Cada projeto é feito do zero, com código próprio e design pensado para o negócio do cliente.',
    'Você fala diretamente comigo. Eu executo, entrego e continuo do lado. O projeto não termina na entrega.',
  ],
  stats: [
    { value: 'Desde 2021', label: 'No mercado' },
    { value: 'Código próprio', label: 'Nada de template' },
    { value: '1:1', label: 'Direto comigo' },
  ],
}

export const ctaContent = {
  title: {
    line1: 'Pronto pra ter alguém',
    line2: 'do seu lado de verdade?',
  },
  buttonText: 'Falar no WhatsApp',
}

export const footerContent = {
  logoText: 'GVNNCRZ.',
  ctaText: 'Tem um projeto parado ou um site que você tem vergonha de mostrar? Me fala.',
  ctaLinkText: 'Fale Comigo',
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Serviços', href: '#services' },
    { label: 'Sobre', href: '#about' },
    { label: 'Contato', href: '#contact' },
  ],
  email: 'giovannicruz.dev@gmail.com',
  socialLinks: [{ label: 'Instagram', href: 'https://www.instagram.com/giovannicruz.dev' }],
  copyright: (year: number) => `© Giovanni Cruz ${year}. Todos os direitos reservados.`,
}
