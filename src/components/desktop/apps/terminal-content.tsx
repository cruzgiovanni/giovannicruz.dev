'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from '@/components/locale-provider'
import { getInfo, SHOW_PROJECTS } from '@/data/info'

const CONTACT_COMMAND = 'contact'

// Catppuccin Mocha: Base background, Text for input, Subtext 1 for output, Overlay 2 for muted lines,
// Green and Blue for the prompt, Blue for links, Red for errors, Rosewater for the caret

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
  isError?: boolean
}

function Prompt() {
  return (
    <span className="shrink-0 whitespace-nowrap">
      <span className="text-[#a6e3a1] hidden md:inline">guest@cruz-os</span>
      <span className="hidden md:inline">:</span>
      <span className="text-[#89b4fa]">~</span>
      <span>$&nbsp;</span>
    </span>
  )
}

export function TerminalContent() {
  const locale = useLocale()
  const t = copy[locale]
  // The same content the ReadMe shows, so both stay in step with src/data
  const { hero, aboutSection, skillCategories, projects, contactSection } = getInfo(locale)
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
    let isError = false

    switch (cmd) {
      case 'help':
        output = helpText(t)
        break

      case 'about':
        output = `${hero.name}
${hero.badge}

${aboutSection.paragraphs.map((paragraph) => paragraph.trim()).join('\n\n')}

${aboutSection.signature}

${aboutSection.stats.map((stat) => `${stat.value} ${stat.label}`).join('\n')}`
        break

      case 'skills':
        output = skillCategories.map((category) => `${category.title}: ${category.technologies.join(', ')}`).join('\n')
        break

      case 'projects':
        if (!SHOW_PROJECTS) {
          output = t.commandNotFound(command)
          isError = true
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
            isError = true
          }
        } else {
          output = t.commandNotFound(command)
          isError = true
        }
    }

    setHistory((prev) => [...prev, { command, output, isContact, isError }])
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
    <div className="text-[#bac2de] mt-1 ml-0">
      <p>
        {contactSection.email.label}:{' '}
        <a
          href={`mailto:${contactSection.email.value}`}
          className="text-[#89b4fa] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {contactSection.email.value}
        </a>
      </p>
      <p>
        {contactSection.location.label}: {contactSection.location.value}
      </p>
      {contactSection.socials.map((social) => (
        <p key={social.name}>
          {social.name}:{' '}
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#89b4fa] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {social.url}
          </a>
        </p>
      ))}
    </div>
  )

  return (
    <main
      ref={terminalRef}
      className="h-full bg-[#1e1e2e] text-[#cdd6f4] selection:bg-[#9399b2]/30 font-mono text-xs md:text-sm p-3 cursor-text"
      style={{
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
      onClick={focusInput}
    >
      {/* Welcome message */}
      <div className="mb-4 text-[#9399b2]">
        <p>Cruz OS Terminal v1.0</p>
        <p>{t.welcome}</p>
        <p className="mt-2">---</p>
      </div>

      {/* Command history */}
      {history.map((entry, index) => (
        <div key={index} className="mb-2">
          <div className="flex">
            <Prompt />
            <span className="break-all">{entry.command}</span>
          </div>
          {entry.isContact
            ? renderContactOutput()
            : entry.output && (
                <pre
                  className={`${entry.isError ? 'text-[#f38ba8]' : 'text-[#bac2de]'} whitespace-pre-wrap mt-1 ml-0`}
                >
                  {entry.output}
                </pre>
              )}
        </div>
      ))}

      {/* Current input line */}
      <div className="flex items-center">
        <Prompt />
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent text-[#cdd6f4] outline-none border-none caret-[#f5e0dc]"
          autoFocus
          spellCheck={false}
        />
      </div>
    </main>
  )
}
