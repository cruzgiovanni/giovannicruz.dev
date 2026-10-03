'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from '@/components/locale-provider'
import { getInfo, SHOW_PROJECTS } from '@/data/info'
import { siteConfig } from '@/data/config'

const CONTACT_COMMAND = 'contact'

// Commands stay in English, like a real shell; what they print follows the visitor's language
const copy = {
  en: {
    available: 'Available commands:',
    commands: {
      help: 'Show this help message',
      about: 'About me',
      skills: 'List my skills',
      projects: 'Show my projects',
      contact: 'Contact information',
      clear: 'Clear terminal',
      whoami: 'Who am I?',
      date: 'Show current date',
      echo: 'Echo a message',
      love: 'Displays the love of Giovanni’s life.',
    },
    projects: 'Professional Experience & Projects:',
    projectHint: "Type 'project <number>' for details (e.g., 'project 01')",
    period: 'Period',
    tech: 'Tech',
    type: 'Type',
    experience: 'Professional Experience',
    personal: 'Personal Project',
    projectNotFound: (num: string) => `Project '${num}' not found. Type 'projects' to see available projects.`,
    commandNotFound: (command: string) => `command not found: ${command}. Type 'help' for available commands.`,
    date: () => new Date().toString(),
    email: 'Email',
    location: 'Location',
    welcome: "Type 'help' for available commands.",
  },
  pt: {
    available: 'Comandos disponíveis:',
    commands: {
      help: 'Mostra esta ajuda',
      about: 'Sobre mim',
      skills: 'Lista minhas habilidades',
      projects: 'Mostra meus projetos',
      contact: 'Informações de contato',
      clear: 'Limpa o terminal',
      whoami: 'Quem sou eu?',
      date: 'Mostra a data atual',
      echo: 'Repete uma mensagem',
      love: 'Mostra o amor da vida do Giovanni.',
    },
    projects: 'Experiência profissional e projetos:',
    projectHint: "Digite 'project <número>' para ver os detalhes (ex.: 'project 01')",
    period: 'Período',
    tech: 'Tecnologias',
    type: 'Tipo',
    experience: 'Experiência profissional',
    personal: 'Projeto pessoal',
    projectNotFound: (num: string) =>
      `Projeto '${num}' não encontrado. Digite 'projects' para ver os projetos disponíveis.`,
    commandNotFound: (command: string) =>
      `comando não encontrado: ${command}. Digite 'help' para ver os comandos disponíveis.`,
    date: () => new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'long' }),
    email: 'E-mail',
    location: 'Localização',
    welcome: "Digite 'help' para ver os comandos disponíveis.",
  },
}

function helpText({ available, commands }: (typeof copy)['en' | 'pt']) {
  const lines = Object.entries(commands)
    .filter(([name]) => SHOW_PROJECTS || name !== 'projects')
    .map(([name, description]) => `  ${name.padEnd(8)} - ${description}`)
  return `${available}\n${lines.join('\n')}\n`
}

const JESUS_ASCII = `
⢦⣷⣾⣶⣷⣾⣶⣧⣮⣴⣥⣾⣤⣷⣬⣶⣵⣮⣶⣥⣾⣤⣧⣼⣶⣷⣾⣶⣷⣾⣶⣷⣾⣶⣷⣾⣶⣷⣾⣶⣷⣾⣶⣷⣼⣶⣵⣮⣶⣵⣮⣶⣷⣾⣶⣷⣼⣤⣧⣼⣴⣧⣼⣶⡡
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⣛⣛⣻⣿⣟⣿⣟⣿⣛⣛⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇
⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⣛⣭⣶⡜⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⣿⣟⣴⣮⣝⡻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡧
⢼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⣫⣴⣿⣿⣿⣿⡟⣿⣿⣿⣿⡏⣴⢹⣿⣿⣿⡗⣿⣿⣿⣿⣿⣿⣷⣭⡻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡧
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢟⣵⣿⣿⣿⣿⣿⣿⣿⡟⣿⣿⣿⣿⣧⣙⣼⣿⣿⣿⣇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡝⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇
⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣱⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢏⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡷⣿⠿⠛⠋⠉⠉⠉⠉⠙⠛⠧⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣜⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢏⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣎⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣏⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡎⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢼⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣘⠿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⣀⣤⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⢟⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡗
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⣿⣿⣿⣿⣿⣿⣿⣿⣷⡇⠀⠀⠀⠀⠀⣴⣾⣿⣿⣿⣿⣿⣷⣤⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣾⣿⣿⡇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣿⢛⣋⢻⣿⣿⣿⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⠿⢷⣄⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⡟⢻⢻⣿⣿⣷⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢼⣿⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣷⢸⢻⢄⣿⣿⡇⠀⠀⠀⠀⡟⠛⠉⠈⢉⠻⢿⠟⠉⢀⡀⢤⡍⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⡗⣷⢸⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⢼⣿⣿⣿⣷⣷⣾⣿⣿⡇⠀⠀⠀⢠⣄⡐⢅⢀⣄⣱⢿⠠⣈⡆⠀⡀⢠⡇⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣷⣾⣾⣿⣿⡟⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⡱⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⣿⠿⢿⠿⢿⢿⡿⢿⡇⠀⠀⠀⢘⣿⣷⣾⣷⣣⣿⢸⠀⣻⣾⣷⣞⣾⠗⠀⠀⠀⠀⠀⠀⢸⢿⠿⣿⠿⡿⢿⠿⢿⡇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⢱⡿⣛⣛⣛⣛⣛⣛⣛⠀⠀⠀⡀⢻⣿⣿⣿⣿⠟⣾⡆⠹⣿⣿⡿⠋⠀⢀⡀⠀⠀⠀⠀⣚⣛⣛⣛⣛⣛⣛⣛⢷⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⢿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠁⠀⠻⣿⣿⠿⠂⠙⠁⠂⠿⣿⠃⠀⠀⠈⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⢧⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣎⢿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⡸⠁⢀⣠⠥⠄⢠⡀⢹⡆⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⢋⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇
⢺⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⣿⣿⣦⢻⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠐⠛⠋⠀⠀⣰⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⡿⣫⣾⣿⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⣹⣿⣿⣿⣿⣿⣿⣷⠿⣾⢶⡾⣿⣿⣷⣝⢿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠼⠋⢎⠳⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⣿⣿⢟⣵⣿⣿⣿⠷⠿⣶⢶⡾⣿⣿⣿⣿⣿⣿⡇
⢼⣿⣿⣿⣿⣿⣿⣿⢘⣇⢻⡗⣺⣿⣿⣿⣾⣝⢿⣿⣿⣿⣿⠟⠁⠰⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⢟⣡⣾⣿⣿⣿⣿⡇⢹⣿⢸⡗⢺⣿⣿⣿⣿⣿⡇
⠼⣿⣿⣿⣿⣿⣿⣿⣬⣿⣮⣵⣿⣿⣿⣿⣿⣿⣷⣍⡻⠟⠁⠀⠀⢠⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠑⠻⠻⠿⣿⣿⣿⣿⣼⣦⣿⣧⣥⣿⣿⣿⣿⣿⣿⡇
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⢀⣴⡟⣿⣿⣿⣦⣀⢀⡀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⠾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠀⠀⠀⢀⣾⣿⣿⣻⣿⣿⣿⣿⣿⣿⣷⡆⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⠻⣿⣿⣿⣿⣿⣿⣿⣿⡇
⢺⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠀⠰⣿⣿⣿⣽⣿⣻⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣿⣿⣿⣿⣿⡇
⢮⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠋⠁⠀⠀⠀⠀⠀⠅⡀⠉⡻⢿⣿⣿⣿⣿⣿⣿⣿⢟⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⡏
⠼⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⠐⠙⠻⠿⠿⠿⠿⠯⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⡇
⣹⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⠀⠀⠀⠀⠀⠀⠀⠤⠄⠀⠀⠀⠤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⡇
⢲⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⣀⣀⣀⣤⣤⠤⢄⡲⠶⣴⣡⢶⣒⠚⡖⢤⠀⠀⠀⠀⢿⣿⣇
⢎⣿⣿⣿⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠕⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⡆⡎⣭⠙⠛⠟⠉⢲⢘⡌⠛⢣⠻⠀⠁⠂⡀⠀⢽⠨⠀⠀⠀⠀⢸⣿⡧
⢺⣿⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠂⠀⠀⠀⡄⠄⠀⠀⠀⠀⠀⠀⠀⢀⣰⢨⣏⡇⡃⡂⠀⠀⡒⣄⠸⡸⢶⣤⠞⣟⣔⣴⠶⠀⠀⢺⡄⠀⠀⠀⠀⠀⣿⡗
⢺⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⢀⠀⣠⡬⠔⠃⠀⠀⠀⠀⠀⠀⣴⣾⡈⢽⣗⡇⡇⡇⠀⢸⠀⠊⣀⢩⠷⢬⠻⣠⠟⣑⢄⠀⠀⠸⠀⠀⠀⠀⠀⠀⢻⢈
⣹⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠂⢠⡾⠋⡀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣄⣹⣧⡇⠇⠃⠀⢸⣀⠁⡬⢀⡀⠀⡇⣿⣈⢲⣉⠀⠀⢸⡰⠀⠀⠀⠀⠀⠘⡌
⢴⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣼⡴⠴⠤⠂⠀⢸⡇⠀⠀⠀⢀⢻⣿⢵⢛⢇⡃⡄⠃⠀⢺⢠⢛⠲⡦⠀⠀⡗⠫⢬⠞⣈⡴⠖⢼⢘⠀⠀⠀⠀⠀⠀⡘
⢺⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣞⣭⣴⠶⠶⠴⠂⠀⢀⣱⠀⠀⠀⢸⢜⢔⡮⡒⡝⡂⢀⢁⠎⣅⡠⠊⠐⠁⠁⠀⠁⠀⢠⡛⣡⠊⠉⢻⠸⠀⠀⠀⠀⠀⠀⡘
⢹⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢺⣿⠀⠀⢀⠄⠀⠑⢸⡇⠀⠀⠀⢸⣱⠇⡆⣯⡗⠁⠸⠈⠈⡰⠫⠠⠀⠒⠀⠀⠀⠤⣓⡀⡗⢦⡔⢾⣂⠁⠀⠀⠀⠀⠀⡘
⢣⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣇⠀⠀⠊⣠⣶⠘⠀⠀⠀⠀⢸⡿⠃⡧⡷⣏⢱⢨⠱⠆⡑⠿⢃⣜⡃⠀⠀⠈⣛⠶⢺⠑⡣⠼⣴⠸⠀⠀⠀⠀⠀⠀⢘
⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⡄⠀⣰⣿⣿⠆⠀⠀⠀⠀⣰⡇⠃⣇⣿⡇⢸⢐⠈⠙⠰⡄⣛⠶⣁⠀⠀⡄⢯⡢⢋⠆⠇⢀⡾⠘⠀⠀⠀⠀⠀⠀⢌
⠒⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⡇⠀⣯⣿⠁⠀⠀⠀⠀⠀⣿⣃⡻⣝⠯⡁⢄⠸⠀⠀⠃⢥⡚⠜⠀⠀⠀⢠⠀⠒⢅⡀⡄⠀⡥⢆⠀⠀⠀⠀⠀⠀⢌
⢩⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⠓⡔⠉⠀⠀⠀⠀⠀⠀⠰⣱⠶⠶⠬⣥⣄⡈⠐⠀⢸⠀⡁⠀⡨⠄⣀⡤⡈⢨⠗⠉⠂⠁⠀⠉⠀⠀⠀⠀⠀⠀⠀⢌
⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠆⠆⣰⣠⣴⣿⣿⣷⣦⡀⠀⠁⠀⠐⠲⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢌
⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣲⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡌
⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣮⣿⣭⣿⣿⣿⣿⣿⠿⠍⡂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡘
⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠲⣶⣥⣼⣿⣩⣽⠯⢛⠥⡺⠅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡱
⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠚⠖⠢⠩⠔⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱
`

interface HistoryEntry {
  command: string
  output: string
  isContact?: boolean
}

export function TerminalContent() {
  const locale = useLocale()
  const t = copy[locale]
  const { hero, aboutSection, skillCategories, projects } = getInfo(locale)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [history])

  const handleCommand = (command: string) => {
    const cmd = command.trim().toLowerCase()
    let output = ''
    let isContact = false

    switch (cmd) {
      case 'help':
        output = helpText(t)
        break

      case 'about':
        output = `${hero.name}
${hero.badge}

${aboutSection.paragraphs.join('\n\n')}`
        break

      case 'skills':
        output = skillCategories.map((category) => `${category.title}: ${category.technologies.join(', ')}`).join('\n')
        break

      case 'projects':
        if (!SHOW_PROJECTS) {
          output = t.commandNotFound(command)
          break
        }
        output = `${t.projects}

${projects.map((p) => `[${p.number}] ${p.title} - ${p.category} (${p.year})`).join('\n')}

${t.projectHint}`
        break

      case CONTACT_COMMAND:
        isContact = true
        output = 'contact'
        break

      case 'clear':
        setHistory([])
        setCurrentInput('')
        return

      case 'whoami':
        output = 'guest@cruz-os'
        break

      case 'date':
        output = t.date()
        break

      case 'jesus':
      case 'faith':
      case 'god':
      case 'love':
        output = JESUS_ASCII
        break

      case '':
        output = ''
        break

      default:
        if (cmd.startsWith('echo ')) {
          output = command.slice(5)
        } else if (SHOW_PROJECTS && cmd.startsWith('project ')) {
          const num = cmd.slice(8).trim()
          const project = projects.find((p) => p.number === num)
          if (project) {
            const link = project.repo || project.demo || ''
            output = `${project.title}
${project.category}
${t.period}: ${project.year}
${t.tech}: ${project.tech}
${t.type}: ${project.type === 'experience' ? t.experience : t.personal}
${link ? `Link: ${link}` : ''}`
          } else {
            output = t.projectNotFound(num)
          }
        } else {
          output = t.commandNotFound(command)
        }
    }

    setHistory((prev) => [...prev, { command, output, isContact }])
    setCurrentInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(currentInput)
    }
  }

  const focusInput = () => {
    inputRef.current?.focus()
  }

  // Render contact output with clickable links
  const renderContactOutput = () => (
    <div className="text-[#cccccc] mt-1 ml-0">
      <p>
        {t.email}:{' '}
        <a
          href={`mailto:${siteConfig.email}`}
          className="text-[#00aaff] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {siteConfig.email}
        </a>
      </p>
      <p>
        {t.location}: {siteConfig.location[locale]}
      </p>
      <p>
        GitHub:{' '}
        <a
          href={siteConfig.socials.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00aaff] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {siteConfig.socials.github}
        </a>
      </p>
      <p>
        LinkedIn:{' '}
        <a
          href={siteConfig.socials.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00aaff] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {siteConfig.socials.linkedin}
        </a>
      </p>
    </div>
  )

  return (
    <main
      ref={terminalRef}
      className="h-full bg-[#1a1a1a] text-[#00ff00] font-mono text-xs md:text-sm p-3 cursor-text"
      style={{
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
      onClick={focusInput}
    >
      {/* Welcome message */}
      <div className="mb-4 text-[#888888]">
        <p>Cruz OS Terminal v1.0</p>
        <p>{t.welcome}</p>
        <p className="mt-2">---</p>
      </div>

      {/* Command history */}
      {history.map((entry, index) => (
        <div key={index} className="mb-2">
          <div className="flex">
            <span className="shrink-0 whitespace-nowrap">
              <span className="text-[#00aaff] hidden md:inline">guest@cruz-os</span>
              <span className="text-white hidden md:inline">:</span>
              <span className="text-[#aa00ff]">~</span>
              <span className="text-white">$&nbsp;</span>
            </span>
            <span className="text-[#00ff00] break-all">{entry.command}</span>
          </div>
          {entry.isContact
            ? renderContactOutput()
            : entry.output && <pre className="text-[#cccccc] whitespace-pre-wrap mt-1 ml-0">{entry.output}</pre>}
        </div>
      ))}

      {/* Current input line */}
      <div className="flex items-center">
        <span className="shrink-0 whitespace-nowrap">
          <span className="text-[#00aaff] hidden md:inline">guest@cruz-os</span>
          <span className="text-white hidden md:inline">:</span>
          <span className="text-[#aa00ff]">~</span>
          <span className="text-white">$&nbsp;</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent text-[#00ff00] outline-none border-none caret-[#00ff00]"
          autoFocus
          spellCheck={false}
        />
      </div>
    </main>
  )
}
