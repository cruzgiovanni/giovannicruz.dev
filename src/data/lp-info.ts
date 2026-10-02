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
  navLinks: [{ label: 'Contato', href: contactContent.whatsapp }],
  menuLinks: [
    { label: 'Home', href: '/' },
    { label: 'Contato', href: contactContent.whatsapp },
  ],
  socialLinks: [{ label: 'Instagram', href: 'https://www.instagram.com/giovannicruz.dev' }],
}

export const heroContent = {
  greeting: 'Oi, sou o Giovanni Cruz.',
  role: 'Desenvolvedor de software.',
}
