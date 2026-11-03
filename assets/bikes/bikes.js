/*
  Hall de Bikes: os dados de cada bike.

  COMO EDITAR
  - A ordem do array é a ordem da fileira no site (da esquerda para a direita).
  - Só escreva dado confirmado pela loja. Campo sem confirmação fica null e simplesmente não aparece.
  - As bolhas do palco mostram as 4 primeiras especificações preenchidas, nesta ordem:
    potencia, bateria, autonomia, velocidade, freios, suspensao, pneu, peso.
    Para uma bike nova ganhar ficha, é só preencher esses campos: as bolhas aparecem sozinhas.
  - Se a bike tiver menos de 4 especificações, as bolhas completam com os "destaques" (texto curto, sem número).
  - Valor com número: escreva "1000 W", "32 km/h", "50 a 60 km". O número conta até o valor quando a bolha entra.
    Para mostrar um número diferente do texto principal (caso da bateria), use { valor, unidade, nota }.
  - frente: para que lado a frente da bike aponta no recorte PNG ("esq" ou "dir").
    O 3D começa olhando do mesmo lado, para o recorte trocar pelo modelo sem pulo.
  - giro: correção em graus para a frente do modelo 3D apontar para a direita na vista "Lateral".
  - espelhar: true só se o recorte não tiver texto visível (logo, adesivo, marca no pneu).
*/
export const BIKES = [
  {
    slug: 'inow-verde',
    nome: 'Inow verde',
    marca: 'Inow',
    frase: 'Verde-menta, farol redondo e pneu fat Kenda, com amortecedor atrás.',
    frente: 'dir', giro: 0, espelhar: false,
    specs: { potencia: null, bateria: null, autonomia: null, velocidade: null, freios: null, suspensao: null, pneu: null, peso: null },
    destaques: [
      { rotulo: 'Estilo', texto: 'Visual retrô de moto' },
      { rotulo: 'Pneu', texto: 'Fat Kenda' },
      { rotulo: 'Suspensão', texto: 'Amortecedor traseiro' },
      { rotulo: 'Freio', texto: 'A disco' },
    ],
  },
  {
    slug: 'retro-preta',
    nome: 'Retrô preta',
    marca: null, // marca a confirmar com a loja; null não aparece no card
    frase: 'Preta fosca, banco longo em gomos com garupa e farol redondo com grade.',
    frente: 'dir', giro: 0, espelhar: false,
    specs: { potencia: null, bateria: null, autonomia: null, velocidade: null, freios: null, suspensao: null, pneu: null, peso: null },
    destaques: [
      { rotulo: 'Banco', texto: 'Longo, com garupa' },
      { rotulo: 'Pneu', texto: 'Fat Kenda' },
      { rotulo: 'Suspensão', texto: 'Amortecedor traseiro' },
      { rotulo: 'Farol', texto: 'Redondo, com grade' },
    ],
  },
  {
    // Confirmar com a loja se a bike da foto é a V8 ou a V8 Pro.
    // Fontes: megaeletronbrava.com.br/produto/bikes-eletricas/ouxi-v8-pro-1000w/ e ouxi-ebike.com (versão Brasil)
    slug: 'ouxi-v8-pro',
    nome: 'Ouxi V8 Pro',
    marca: 'Ouxi',
    frase: 'Banco de couro para dois e pneu fat que encara a areia batida.',
    frente: 'esq', giro: 180, espelhar: false,
    specs: {
      potencia: '1000 W',
      bateria: { valor: '720', unidade: 'Wh', nota: '48 V 15 Ah · removível' },
      autonomia: '50 a 60 km',
      velocidade: '32 km/h',
      freios: 'Disco dianteiro e traseiro',
      suspensao: 'Dianteira',
      pneu: '20 × 4.0 fat',
      peso: '45 kg',
    },
    destaques: [],
  },
  {
    // Fontes: lojagtsm1.com.br (versão Brasil) e ouxi-ebike.com
    slug: 'ouxi-gt2000',
    nome: 'Ouxi GT2000',
    marca: 'Ouxi',
    frase: 'Visual de moto de trilha, com o dobro de bateria da V8.',
    frente: 'esq', giro: 180, espelhar: false,
    specs: {
      potencia: '1000 W',
      bateria: { valor: '1.440', unidade: 'Wh', nota: '48 V 30 Ah · removível' },
      autonomia: null,
      velocidade: '32 km/h',
      freios: 'Hidráulico a disco',
      suspensao: 'Total',
      pneu: null,
      peso: '45 kg',
    },
    cambio: 'Shimano 7 marchas',
    destaques: [],
  },
  {
    slug: 'ouxi-branca',
    nome: 'Ouxi quadro baixo',
    marca: 'Ouxi',
    frase: 'Quadro baixo: você sobe sem passar a perna por cima do banco.',
    frente: 'esq', giro: 180, espelhar: false,
    specs: { potencia: null, bateria: null, autonomia: null, velocidade: null, freios: null, suspensao: null, pneu: null, peso: null },
    destaques: [
      { rotulo: 'Quadro', texto: 'Baixo, fácil de subir' },
      { rotulo: 'Suspensão', texto: 'Amortecedor traseiro' },
      { rotulo: 'Freio', texto: 'A disco' },
      { rotulo: 'Pneu', texto: 'Fat' },
    ],
  },
];

export const ROTULOS = {
  potencia: 'Potência', bateria: 'Bateria', autonomia: 'Autonomia', velocidade: 'Velocidade máx.',
  freios: 'Freios', suspensao: 'Suspensão', pneu: 'Pneu', peso: 'Peso',
};
