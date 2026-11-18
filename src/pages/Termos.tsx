import { PaginaLegal } from '../components/PaginaLegal';
import type { SecaoLegal } from '../components/PaginaLegal';

const EMAIL = 'suportebokka@gmail.com';

const SECOES: SecaoLegal[] = [
  {
    titulo: 'O serviço',
    paragrafos: [
      'O Bokka é um sistema online (SaaS) de gestão para clínicas e consultórios odontológicos. Ele reúne agenda, cadastro de pacientes, prontuário e odontograma, financeiro, estoque e relatórios, além de integrações opcionais, como a sincronização com o Google Calendar.',
      'Ao criar uma conta ou usar o sistema, você declara que leu e concorda com estes Termos e com a Política de Privacidade.',
    ],
  },
  {
    titulo: 'Cadastro e responsabilidade da conta',
    paragrafos: [
      'O Bokka funciona no modelo de conta mãe: o assinante (o dono da clínica ou o profissional autônomo) é o titular da conta e quem cadastra dentistas, funcionários e demais usuários.',
      'O assinante é responsável por todos os dados cadastrados na conta, por definir as permissões de cada usuário e por todas as atividades feitas com os acessos que criou. Também é responsável por obter, quando necessário, as autorizações dos pacientes para o tratamento de seus dados.',
    ],
  },
  {
    titulo: 'Assinatura e pagamento',
    paragrafos: [
      'O acesso ao sistema pode depender de uma assinatura, com condições, planos e formas de pagamento informados no momento da contratação. A cobrança é recorrente, conforme o plano escolhido, até que a assinatura seja cancelada.',
      'O Bokka pode alterar preços e planos, avisando os assinantes com antecedência razoável. A falta de pagamento pode levar à suspensão do acesso, sem apagar os dados imediatamente.',
    ],
  },
  {
    titulo: 'Responsabilidades do usuário',
    itens: [
      'Usar o sistema apenas para fins lícitos e de acordo com a legislação aplicável, inclusive as normas da área da saúde.',
      'Manter suas credenciais em sigilo e avisar o Bokka em caso de suspeita de acesso indevido.',
      'Inserir informações verdadeiras, completas e atualizadas.',
      'Não tentar violar a segurança do sistema, acessar dados de outras clínicas, copiar ou revender o serviço.',
      'Cumprir o dever de sigilo profissional sobre as informações dos pacientes.',
    ],
  },
  {
    titulo: 'Disponibilidade e suporte',
    paragrafos: [
      'Trabalhamos para manter o sistema disponível e seguro, mas podem ocorrer paradas para manutenção ou falhas fora do nosso controle. O suporte é prestado pelo e-mail de contato abaixo.',
    ],
  },
  {
    titulo: 'Limitação de responsabilidade',
    paragrafos: [
      'O Bokka é uma ferramenta de apoio à gestão e não substitui o julgamento clínico nem as obrigações profissionais e legais da clínica. As decisões clínicas, o preenchimento do prontuário e o atendimento aos pacientes são de responsabilidade exclusiva dos profissionais.',
      'Na máxima extensão permitida pela lei, o Bokka não responde por danos indiretos, lucros cessantes ou perdas decorrentes de uso indevido do sistema, de dados incorretos inseridos pelo usuário, de indisponibilidade de serviços de terceiros (como o Google) ou de eventos fora de seu controle razoável.',
    ],
  },
  {
    titulo: 'Cancelamento e rescisão',
    paragrafos: [
      'O assinante pode cancelar a assinatura a qualquer momento, com efeito ao fim do período já pago. O Bokka pode suspender ou encerrar contas que violem estes Termos ou a lei, em caso de fraude ou de uso que ponha o serviço ou outros usuários em risco.',
      'Após o encerramento, o assinante terá um prazo para solicitar a exportação dos seus dados. Depois disso, os dados serão tratados conforme a Política de Privacidade, respeitados os prazos de guarda exigidos por lei.',
    ],
  },
  {
    titulo: 'Alterações destes Termos',
    paragrafos: [
      'Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas no sistema ou por e-mail, e o uso continuado após a mudança indica concordância com a nova versão.',
    ],
  },
  {
    titulo: 'Lei aplicável e foro',
    paragrafos: [
      'Estes Termos são regidos pelas leis do Brasil. Eventuais disputas serão resolvidas no foro da comarca do domicílio do consumidor, quando aplicável o Código de Defesa do Consumidor, ou no foro eleito entre as partes nos demais casos.',
    ],
  },
  {
    titulo: 'Contato',
    paragrafos: [
      <>
        Dúvidas sobre estes Termos ou sobre o serviço:{' '}
        <a href={`mailto:${EMAIL}`} className="font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover">
          {EMAIL}
        </a>
        .
      </>,
    ],
  },
];

export const Termos = () => (
  <PaginaLegal
    titulo="Termos de Serviço"
    atualizacao="Última atualização: 17 de novembro de 2026"
    introducao="Estes Termos regulam o uso do Bokka, sistema de gestão para clínicas e consultórios odontológicos."
    secoes={SECOES}
    outra={{ para: '/privacidade', rotulo: 'Política de Privacidade' }}
  />
);
