import { PaginaLegal } from '../components/PaginaLegal';
import type { SecaoLegal } from '../components/PaginaLegal';

const EMAIL = 'suportebokka@gmail.com';

const Email = () => (
  <a href={`mailto:${EMAIL}`} className="font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover">
    {EMAIL}
  </a>
);

const SECOES: SecaoLegal[] = [
  {
    titulo: 'Quem é o controlador dos dados',
    paragrafos: [
      'O controlador dos dados é o Bokka — Gestão Odontológica, sistema de gestão para clínicas e consultórios odontológicos oferecido como serviço online (SaaS). Em relação aos dados da conta e do uso do sistema, o Bokka atua como controlador.',
      'Em relação aos dados dos pacientes que cada clínica cadastra, a própria clínica (o assinante) é a controladora e o Bokka atua como operador, tratando os dados apenas para prestar o serviço contratado.',
    ],
  },
  {
    titulo: 'Quais dados coletamos',
    paragrafos: ['Os dados tratados dependem do que a clínica cadastra e usa no sistema:'],
    itens: [
      'Clínicas, dentistas e funcionários: nome, e-mail, telefone, cargo, registro profissional, permissões de acesso e dados de login (a senha é guardada de forma criptografada).',
      'Pacientes: identificação (nome, documento de identificação, data de nascimento), contato, endereço e convênio.',
      'Dados de saúde: prontuário odontológico, odontograma, procedimentos e observações clínicas.',
      'Agendamentos: datas, horários, dentista responsável e status das consultas.',
      'Dados financeiros: valores, formas de pagamento, contas a receber e a pagar, e movimentação de caixa.',
      'Dados técnicos de uso: registros de acesso e de ações no sistema (auditoria), necessários para segurança.',
    ],
  },
  {
    titulo: 'Para que usamos os dados',
    itens: [
      'Operar o sistema e permitir o login e o controle de permissões.',
      'Organizar a agenda e os agendamentos da clínica.',
      'Manter o prontuário e o odontograma dos pacientes.',
      'Controlar o faturamento, o financeiro e o estoque.',
      'Enviar e-mails do próprio sistema, como confirmação de cadastro e recuperação de senha.',
      'Garantir a segurança, prevenir fraudes e cumprir obrigações legais.',
    ],
  },
  {
    titulo: 'Base legal (LGPD)',
    paragrafos: ['O tratamento é feito conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), com base em:'],
    itens: [
      'Execução de contrato: para prestar o serviço contratado pela clínica.',
      'Consentimento: quando aplicável, por exemplo ao conectar a integração opcional com o Google Calendar.',
      'Cumprimento de obrigação legal ou regulatória: para dados de saúde e registros que a legislação exige que sejam mantidos.',
      'Tutela da saúde, em procedimentos realizados por profissionais de saúde: para o prontuário e os dados clínicos dos pacientes.',
    ],
  },
  {
    titulo: 'Compartilhamento de dados',
    paragrafos: [
      'Não vendemos dados pessoais. Os dados só são compartilhados nas situações abaixo:',
    ],
    itens: [
      'Com prestadores de serviço necessários ao funcionamento do sistema (hospedagem, banco de dados e envio de e-mails), que seguem as mesmas exigências de proteção.',
      'Com autoridades, quando houver obrigação legal ou ordem judicial.',
      'Com o Google, somente se o usuário autorizar a integração com o Google Calendar. Nesse caso, são enviados apenas os dados de agenda necessários para criar e atualizar os eventos (título, data, horário e descrição do compromisso). Dados de prontuário, odontograma e financeiros nunca são enviados ao Google.',
    ],
  },
  {
    titulo: 'Integração com o Google Calendar',
    paragrafos: [
      'A integração é opcional e só é ativada quando o próprio usuário a conecta, na tela de configurações, autorizando o acesso à sua conta Google. O usuário pode desconectá-la a qualquer momento no Bokka ou nas configurações de segurança da sua conta Google, e isso revoga o acesso.',
      'O uso e a transferência, para qualquer outro aplicativo, das informações recebidas das APIs do Google seguirão a Política de Dados de Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado. Os dados do Google Calendar são usados somente para sincronizar a agenda dentro do Bokka, não são usados para publicidade e não são vendidos nem transferidos a terceiros.',
    ],
  },
  {
    titulo: 'Por quanto tempo guardamos os dados',
    paragrafos: [
      'Os dados ficam armazenados enquanto a conta da clínica estiver ativa. Os registros de prontuário podem ter prazo mínimo de guarda definido em lei ou em normas dos conselhos profissionais, e nesse caso serão mantidos pelo período exigido.',
      'Ao encerrar a conta, os dados que não precisem ser mantidos por obrigação legal são excluídos ou anonimizados em prazo razoável. Backups são eliminados conforme o ciclo de rotação.',
    ],
  },
  {
    titulo: 'Seus direitos como titular',
    paragrafos: ['Conforme a LGPD, o titular pode solicitar a qualquer momento:'],
    itens: [
      'Confirmação de que tratamos seus dados e acesso a eles.',
      'Correção de dados incompletos, inexatos ou desatualizados.',
      'Anonimização, bloqueio ou exclusão de dados desnecessários ou tratados em desacordo com a lei.',
      'Portabilidade dos dados.',
      'Informações sobre com quem os dados são compartilhados.',
      'Revogação do consentimento, quando o tratamento se basear nele.',
    ],
  },
  {
    titulo: 'Segurança',
    paragrafos: [
      'Adotamos medidas técnicas e organizacionais para proteger os dados, como comunicação criptografada (HTTPS), senhas armazenadas de forma criptografada, controle de acesso por permissões e registro de auditoria. Nenhum sistema é totalmente imune a falhas, e em caso de incidente relevante os envolvidos serão avisados conforme a lei.',
    ],
  },
  {
    titulo: 'Contato',
    paragrafos: [
      <>
        Para exercer seus direitos ou tirar dúvidas sobre esta política, escreva para <Email />.
      </>,
      'Esta política pode ser atualizada. Mudanças relevantes serão indicadas na data de atualização no topo desta página.',
    ],
  },
];

export const Privacidade = () => (
  <PaginaLegal
    titulo="Política de Privacidade"
    atualizacao="Última atualização: 17 de novembro de 2026"
    introducao="Esta política explica como o Bokka trata os dados pessoais de quem usa o sistema, em linguagem simples e de acordo com a LGPD."
    secoes={SECOES}
    outra={{ para: '/termos', rotulo: 'Termos de Serviço' }}
  />
);
