'use strict';
/* EVENTS — banco de eventos, sorteio ponderado, escolhas e consequências */

/* ---------- BANCO DE EVENTOS ---------- */
/* ev(id, categoria, área, gravidade(0 positivo,1,2 grave,3 crise), título, descrição, probabilidade,
      opções[[rótulo, custo, efeitos, {set, sch:[[atraso,id]], r:[prob, efeitosSim, efeitosNão], m}]], condição, bônus por flags) */
const EV = [];
const ev = (id, cat, area, g, t, d, p, o, w, ifs) => EV.push({ id, cat, area, g, t, d, p, o, w, ifs });
const SAUDE = 'Saúde', EDU = 'Educação', INF = 'Infraestrutura', RUR = 'Zona rural', AGU = 'Água', ECO = 'Economia', AMB = 'Meio ambiente', CUL = 'Cultura', TRA = 'Transparência', EME = 'Emergência', FIN = 'Finanças', ASS = 'Assistência social', MOB = 'Mobilidade', ADM = 'Administração', POL = 'Política pública';

/* Saúde */
ev('posto', SAUDE, 'bairros', 1, 'Unidade de saúde com problemas', 'Uma unidade de saúde apresenta problemas estruturais e funcionários relatam falta de equipamentos.', 15, [
  ['Reforma completa', 900, 's14 p6 i1', { set: 'posto' }], ['Compra emergencial de equipamentos', 250, 's8 p3'],
  ['Reforma parcial', 400, 's6 p2', { sch: [[8, 'posto2']] }], ['Adiar', 0, 's-6 p-5', { sch: [[6, 'filas']] }]]);
ev('posto2', SAUDE, 'bairros', 1, 'A reforma parcial mostrou limites', 'Uma decisão tomada há algumas rodadas cobra o preço: surgiu infiltração na parte não reformada da unidade.', 0, [
  ['Concluir a reforma', 350, 's7 p2'], ['Remendo rápido', 80, 's2'], ['Deixar como está', 0, 's-4 p-3']]);
ev('filas', SAUDE, 'bairros', 1, 'Filas crescem na saúde', 'Sem a estrutura adequada, as filas de atendimento aumentaram e a população reclama.', 0, [
  ['Mutirão de consultas', 260, 's9 p4'], ['Ampliar horário de atendimento', 140, 's4 p1 e-1'], ['Ignorar', 0, 's-7 p-8']]);
ev('dengue', SAUDE, 'bairros', 2, 'Surto de arboviroses', 'Casos de dengue aumentam rapidamente nos bairros.', 8, [
  ['Campanha e mutirão de limpeza', 300, 's8 p4 m2'], ['Fumacê emergencial', 150, 's4 p1 m-3'], ['Apenas orientação pela imprensa', 20, 's-8 p-6']]);
ev('ambul', SAUDE, 'comunid', 1, 'Ambulância quebrada', 'A única ambulância que atende comunidades distantes parou de funcionar.', 10, [
  ['Comprar ambulância nova', 380, 's7 p3 r3'], ['Consertar a antiga', 90, 's3 r1'], ['Pedir apoio a um consórcio regional', 40, 's1', { r: [.55, 's7 r4 $250', 'p-1'] }]]);
ev('medicos', SAUDE, 'rural', 1, 'Falta de médicos', 'Equipes de saúde da família estão incompletas e comunidades ficam sem atendimento regular.', 8, [
  ['Incentivo salarial', 280, 's10 p3 c-1'], ['Contratos temporários', 120, 's5 p1'], ['Aguardar programa estadual', 30, 's-2', { r: [.5, 's10 $200', 's-3 p-2'] }]]);
ev('vacina', SAUDE, 'rural', 0, 'Campanha estadual de vacinação', 'Um programa fictício oferece vacinas, mas exige que o município mobilize equipes.', 8, [
  ['Busca ativa na zona rural', 180, 's6 r4 p2'], ['Vacinar apenas nas unidades', 60, 's3 r-1'], ['Não participar', 0, 's-3 p-2']]);
ev('demSaude', SAUDE, 'centro', 0, 'Aumento inesperado de demanda', 'Uma unidade recebe muito mais pacientes do que o previsto por causa de uma migração sazonal.', 3, [
  ['Reforçar equipe', 200, 's6 p3'], ['Redirecionar pacientes', 0, 's-3 p-2 i-1']]);
/* Educação */
ev('escola', EDU, 'bairros', 1, 'Escola precisa de reparos urgentes', 'Uma escola precisa de manutenção urgente antes do início das aulas.', 14, [
  ['Reforma completa', 700, 'e13 p5 s-1'], ['Reparos emergenciais', 200, 'e6 p2'], ['Adiar para o próximo semestre', 0, 'e-6 p-4', { sch: [[7, 'evasao']] }], ['Buscar parceria', 40, 'e2', { r: [.55, 'e10 $300 p2', 'p-1'] }]]);
ev('transpEsc', EDU, 'rural', 1, 'Transporte escolar em risco', 'Ônibus escolares apresentam desgaste e alunos da zona rural chegam atrasados.', 10, [
  ['Renovar parte da frota', 600, 'e8 r6 p4'], ['Manutenção geral', 160, 'e4 r2'], ['Reorganizar rotas', 30, 'e1 r-2 p-1']]);
ev('merenda', EDU, 'centro', 1, 'Problemas com a merenda escolar', 'Fornecedores atrasam a entrega e cardápios estão sendo reduzidos.', 9, [
  ['Renegociar contratos', 120, 'e4 t2'], ['Compra emergencial', 240, 'e6 p3 c-1'], ['Comprar da agricultura familiar', 200, 'e5 r5 c2']]);
ev('evasao', EDU, 'bairros', 1, 'Aumento da evasão escolar', 'Diretores notam que mais estudantes deixam as aulas.', 6, [
  ['Programa de busca ativa', 220, 'e8 p3'], ['Campanha de conscientização', 60, 'e3'], ['Nenhuma ação', 0, 'e-7 p-4']]);
ev('internet', EDU, 'centro', 0, 'Programa de conectividade escolar', 'Um programa fictício oferece equipamentos se o município preparar a infraestrutura.', 6, [
  ['Aderir com infraestrutura completa', 450, 'e12 c2 p3'], ['Aderir parcialmente', 150, 'e5'], ['Recusar', 0, 'e-1']]);
ev('greve', EDU, 'centro', 2, 'Professores ameaçam paralisação', 'A categoria pede reajuste e melhores condições de trabalho.', 6, [
  ['Conceder reajuste', 500, 'e10 p5 c-1 $-0'], ['Propor plano gradual', 180, 'e3 p1'], ['Recusar negociação', 0, 'e-12 p-9']], s => S.turn > 6);
ev('biblio', EDU, 'centro', 0, 'Doação de acervo para biblioteca', 'Uma instituição oferece livros, se houver espaço e organização.', 4, [
  ['Reformar espaço e catalogar', 160, 'e5 p2'], ['Receber sem estrutura', 20, 'e1'], ['Recusar', 0, 'p-1']]);
/* Infraestrutura */
ev('estrada', INF, 'estradas', 1, 'Estrada rural intransitável', 'Após vários dias de chuva, um trecho de estrada rural ficou praticamente intransitável.', 15, [
  ['Recuperar imediatamente', 500, 'i9 r8 p4', { set: 'estradaOk' }], ['Intervenção emergencial', 180, 'i4 r4 p1', { sch: [[15, 'estradaPiora']] }],
  ['Esperar a estiagem', 0, 'i-3 r-4 p-2', { sch: [[6, 'onibus'], [11, 'reclama'], [17, 'estradaPiora']] }], ['Buscar convênio', 50, 'r1', { r: [.55, 'i8 r6 $150', 'p-1'] }]]);
ev('onibus', INF, 'estradas', 1, 'Ônibus escolar teve dificuldade', 'Um ônibus escolar teve dificuldade para passar pelo trecho sem manutenção.', 0, [
  ['Consertar o trecho agora', 320, 'i6 r5 e3'], ['Desviar a rota', 60, 'e-1 r-1'], ['Manter como está', 0, 'e-4 r-3 p-3']]);
ev('reclama', INF, 'comunid', 1, 'Moradores reclamam do acesso', 'Moradores reclamam da dificuldade de acesso pela estrada esquecida.', 0, [
  ['Reunião e cronograma público', 20, 't4 p2'], ['Recuperar o trecho', 400, 'i7 r6 p4'], ['Ignorar as queixas', 0, 'p-5 t-2']]);
ev('estradaPiora', INF, 'estradas', 2, 'Chuva danificou ainda mais a estrada', 'Uma chuva forte piorou o trecho que já estava em más condições.', 0, [
  ['Reconstrução completa', 700, 'i10 r8 p3'], ['Reparo básico', 250, 'i3 r2'], ['Isolar o trecho', 30, 'i-5 r-6 p-4']], s => !s.flags.estradaOk);
ev('pav', INF, 'bairros', 1, 'Pedido de pavimentação', 'Moradores de um bairro pedem pavimentação depois de anos de poeira e lama.', 10, [
  ['Pavimentar todo o bairro', 1200, 'i15 c5 p6 s-2'], ['Pavimentar as ruas principais', 500, 'i7 p3'], ['Cascalhamento simples', 80, 'i2 p1']]);
ev('dren', INF, 'centro', 1, 'Drenagem urbana insuficiente', 'Técnicos alertam que a drenagem pode falhar na próxima temporada de chuvas.', 8, [
  ['Grande obra de drenagem', 850, 'i9 p2', { set: 'dren', sch: [[14, 'chuvaBoa']] }], ['Limpeza de galerias', 100, 'i2'], ['Deixar para depois', 0, 'p0']]);
ev('chuvaBoa', INF, 'centro', 0, 'Poucos pontos de alagamento', 'Após fortes chuvas, a cidade registrou poucos pontos de alagamento graças às obras anteriores.', 0, [
  ['Divulgar os resultados', 20, 'p6 t3'], ['Seguir em frente', 0, 'p3']]);
ev('ponte', INF, 'estradas', 2, 'Ponte com rachaduras', 'Uma ponte que liga comunidades apresenta rachaduras visíveis.', 5, [
  ['Reforma estrutural', 750, 'i10 r6 p4'], ['Restringir tráfego pesado', 60, 'i2 r-2 c-2'], ['Monitorar', 0, 'i-4 r-2']]);
ev('luz', INF, 'centro', 0, 'Programa de iluminação eficiente', 'Trocar lâmpadas por LED pode reduzir custos, mas exige investimento inicial.', 7, [
  ['Trocar toda a rede', 650, 'i6 m3 p3 $200'], ['Trocar só o centro', 250, 'i2 p2 $60'], ['Manter como está', 0, 'i-1']]);
ev('chuvas', INF, 'estradas', 2, 'Chuvas intensas', 'Uma sequência de chuvas fortes provoca problemas em estradas, drenagem, pontes e zona rural.', 9, [
  ['Mobilizar todas as equipes', 420, 'i6 r3 p3'], ['Atender só os pontos críticos', 150, 'i-2 r-3 p-1'], ['Aguardar o nível baixar', 0, 'i-9 r-7 p-6 s-2']], null,
  [['dren', 'i7 p4'], ['estradaOk', 'i4 r5 p2']]);
/* Zona rural */
ev('estiagem', RUR, 'rural', 2, 'Estiagem prolongada', 'A falta de chuva afeta pequenos produtores e o rebanho.', 9, [
  ['Distribuir ração e sementes', 320, 'r9 c2 p4'], ['Apoiar só os mais vulneráveis', 130, 'r4 p1'], ['Aguardar apoio de outros níveis de governo', 0, 'r-8 c-3 p-5']]);
ev('assTec', RUR, 'rural', 0, 'Cooperativa pede assistência técnica', 'Produtores propõem um projeto de manejo e comercialização em conjunto.', 7, [
  ['Contratar equipe técnica', 260, 'r8 c4 p3'], ['Ceder um técnico da prefeitura', 60, 'r3 c1'], ['Não participar', 0, 'r-2']]);
ev('escoa', RUR, 'rural', 1, 'Dificuldade para escoar a produção', 'Sem transporte adequado, parte da produção se perde antes de chegar à feira.', 6, [
  ['Criar rota de escoamento', 300, 'r7 c4 i-1'], ['Feira itinerante', 110, 'r3 c2'], ['Nenhuma ação', 0, 'r-5 c-2']]);
ev('cerca', RUR, 'comunid', 1, 'Conflito entre comunidades', 'Duas comunidades discordam sobre o uso de um reservatório comunitário.', 5, [
  ['Mediar com regras claras', 40, 'r3 t2 p2'], ['Ampliar o reservatório', 380, 'r5 a5 p3'], ['Não intervir', 0, 'r-4 p-3']]);
/* Água */
ev('agua', AGU, 'comunid', 2, 'Comunidades sem água', 'Comunidades rurais relatam dificuldade de acesso à água.', 12, [
  ['Operação emergencial de abastecimento', 280, 'a8 r4 p3'], ['Infraestrutura permanente', 1000, 'a16 r8 p5'], ['Atender só as áreas críticas', 130, 'a4 r1'], ['Buscar recursos externos', 50, 'a1', { r: [.55, 'a10 r5 $400', 'p-2'] }]]);
ev('adutora', AGU, 'centro', 1, 'Vazamento na adutora', 'Uma tubulação antiga vaza e desperdiça água tratada.', 8, [
  ['Trocar o trecho', 450, 'a10 i2'], ['Remendo emergencial', 90, 'a3', { sch: [[9, 'adutora']] }], ['Aguardar', 0, 'a-7 p-3']]);
ev('dessal', AGU, 'rural', 0, 'Programa de dessalinizadores', 'Existe possibilidade de instalar dessalinizadores em comunidades com água salobra.', 5, [
  ['Instalar em várias comunidades', 520, 'a10 r7 m-1 p4'], ['Projeto-piloto', 180, 'a4 r3'], ['Não participar', 0, 'a-1']]);
ev('pipa', AGU, 'comunid', 1, 'Contrato de carro-pipa vencendo', 'O contrato de abastecimento por carros-pipa está perto do fim.', 6, [
  ['Renovar com fiscalização', 240, 'a6 t3 r3'], ['Renovar sem mudanças', 190, 'a5 r2 t-2'], ['Reduzir a frota', 90, 'a-3 r-3 $40']]);
/* Economia, cultura, meio ambiente */
ev('festival', CUL, 'centro', 0, 'Festival cultural movimenta a cidade', 'Um evento cultural movimentou a cidade e comerciantes pedem apoio da administração.', 9, [
  ['Investir no evento', 450, 'c6 p6 t-1'], ['Apoiar parcialmente', 180, 'c3 p3'], ['Não utilizar recursos públicos', 0, 'p-2 c-1'], ['Buscar patrocinadores privados', 40, 'p1', { r: [.55, 'c5 p4 $200', 'p-1'] }]]);
ev('empresa', ECO, 'centro', 0, 'Empresa quer se instalar', 'Uma empresa avalia instalar uma unidade na cidade e pede incentivos.', 5, [
  ['Incentivo fiscal amplo', 300, 'c12 p4 $-120'], ['Incentivo moderado', 120, 'c6 p2'], ['Sem incentivos', 0, 'c-1']]);
ev('obraDemora', ECO, 'centro', 1, 'Comerciantes reclamam de obra', 'A demora em uma obra no centro reduz as vendas no comércio local.', 7, [
  ['Acelerar com turno extra', 200, 'c4 i3 p2'], ['Criar desvio e sinalização', 60, 'c2 p1'], ['Manter o ritmo', 0, 'c-5 p-4']]);
ev('feira', ECO, 'centro', 0, 'Feira de empreendedores', 'Pequenos empreendedores propõem uma feira mensal com apoio da prefeitura.', 6, [
  ['Estrutura e divulgação', 200, 'c6 p3'], ['Ceder apenas o espaço', 30, 'c3'], ['Não apoiar', 0, 'c-2']]);
ev('queimada', AMB, 'rural', 1, 'Focos de queimada', 'Focos de fogo ameaçam áreas de vegetação e pastagens.', 6, [
  ['Brigada e campanha educativa', 220, 'm7 r3 p2'], ['Apenas fiscalização pontual', 60, 'm2'], ['Nenhuma ação', 0, 'm-8 r-3 p-3']]);
ev('lixo', AMB, 'bairros', 1, 'Descarte irregular de lixo', 'Pontos de lixo se acumulam e moradores relatam mau cheiro.', 7, [
  ['Coleta seletiva e ecopontos', 380, 'm9 s2 p4'], ['Mutirão de limpeza', 90, 'm3 p2'], ['Multar infratores', 20, 'm2 p-2 t1']]);
ev('biblioCul', CUL, 'centro', 0, 'Oficinas culturais para jovens', 'Artistas locais propõem oficinas gratuitas em bairros e comunidades.', 5, [
  ['Programa completo', 260, 'p4 e3 s1'], ['Apoio simbólico', 60, 'p1'], ['Sem apoio', 0, 'p-1']]);
/* Transparência, política, admin, sociais */
ev('info', TRA, 'centro', 1, 'Moradores pedem informações sobre obra', 'Moradores solicitam informações detalhadas sobre uma obra em andamento.', 8, [
  ['Publicar todos os dados', 20, 't9 p3'], ['Publicar um relatório resumido', 5, 't3 p1'], ['Adiar a divulgação', 0, 't-8 p-5']]);
ev('irreg', TRA, 'centro', 2, 'Irregularidade administrativa descoberta', 'Uma auditoria interna encontrou falhas em um processo de compras.', 3, [
  ['Apurar e divulgar tudo', 120, 't12 p2 $60'], ['Corrigir discretamente', 20, 't-3 p-2'], ['Arquivar o caso', 0, 't-12 p-8']]);
ev('edital', POL, 'centro', 0, 'Edital de recursos para projetos', 'Um programa estadual fictício abriu edital. É preciso preparar um projeto.', 9, [
  ['Preparar projeto para solicitar recurso', 50, 't1', { r: [.6, '$1000 p3', 'p-1'] }], ['Contratar consultoria para o projeto', 180, 't1', { r: [.85, '$1300 p3', 'p-1'] }], ['Não participar', 0, 'p0']]);
ev('privada', POL, 'centro', 0, 'Proposta de parceria privada', 'Uma empresa propõe apoiar um serviço em troca de visibilidade.', 5, [
  ['Aceitar com contrapartidas claras', 30, 'c3 t2 $350 p1'], ['Aceitar sem exigências', 0, 'c2 $500 t-6 p-2'], ['Recusar', 0, 't2']]);
ev('mob', MOB, 'centro', 1, 'Trânsito confuso no centro', 'Motos e carros disputam espaço em ruas estreitas e há acidentes.', 6, [
  ['Plano de mobilidade e sinalização', 260, 'i5 s2 c2 p3'], ['Agentes nas horas de pico', 90, 'i2 p1'], ['Nenhuma mudança', 0, 's-2 p-3']]);
ev('social', ASS, 'bairros', 1, 'Famílias em vulnerabilidade', 'A assistência social relata aumento de famílias sem renda regular.', 8, [
  ['Ampliar programa de apoio', 320, 'p6 s2 e2 c-1'], ['Cesta básica emergencial', 140, 'p3'], ['Encaminhar a programas de outros governos', 20, 'p-2']]);
ev('servidor', ADM, 'centro', 1, 'Servidores pedem reajuste', 'Sindicato pede recomposição salarial depois de um período de inflação.', 6, [
  ['Reajuste integral', 480, 'p4 s2 e2 $-0'], ['Reajuste parcial', 220, 'p1'], ['Congelar salários', 0, 'p-5 s-2 e-2']]);
ev('maquina', ADM, 'centro', 1, 'Frota da prefeitura em más condições', 'Tratores e caminhões estão parados por falta de peças.', 8, [
  ['Renovar máquinas', 500, 'i5 r4 p2'], ['Manutenção geral', 130, 'i2 r1'], ['Alugar quando necessário', 60, 'i0 $-20']]);
/* Raros e muito raros */
ev('recInes', FIN, 'centro', 0, 'Recurso inesperado', 'Chegou uma transferência extraordinária não prevista no orçamento.', 3, [
  ['Guardar como reserva', 0, '$1200 t2'], ['Investir imediatamente em serviços', 0, '$400 s4 e4 i4 p4'], ['Dividir com programas sociais', 0, '$700 p6']]);
ev('oportInv', ECO, 'centro', 0, 'Grande oportunidade de investimento', 'Um grupo propõe um polo de beneficiamento de produtos regionais.', 3, [
  ['Investir na estrutura', 1400, 'c16 r6 p5'], ['Parceria com contrapartida limitada', 400, 'c7 r2 p2'], ['Recusar', 0, 'c-1']]);
ev('seca', EME, 'rural', 3, 'Seca severa', 'A estiagem ultrapassou todos os limites e várias comunidades entram em situação crítica.', 2, [
  ['Plano de emergência total', 1300, 'a12 r12 p5'], ['Ações direcionadas', 550, 'a5 r5 p1'], ['Pedir apoio externo e aguardar', 60, 'a-8 r-10 p-8 s-3']], s => s.turn >= 8);
ev('crisFin', FIN, 'centro', 3, 'Queda brusca de receitas', 'Uma crise regional derrubou as transferências e a arrecadação.', 1.5, [
  ['Cortar despesas em várias áreas', 0, 's-4 e-4 i-4 p-6 $500'], ['Renegociar dívidas', 100, 'p-2 t2 $150'], ['Manter tudo e usar reservas', 0, '$-800 p1']], s => s.turn >= 10);
ev('regional', ASS, 'comunid', 2, 'Emergência regional', 'Municípios vizinhos enfrentam um desastre e centenas de pessoas buscam abrigo.', 2, [
  ['Abrigo e atendimento completos', 650, 's-2 p8 t2'], ['Apoio limitado', 220, 'p3'], ['Encaminhar a outros locais', 0, 'p-6']]);
ev('grandeObra', INF, 'centro', 2, 'Grande obra necessária', 'Um reservatório antigo ameaça ceder e exige intervenção de grande porte.', 2, [
  ['Obra completa', 1500, 'a10 i6 p5'], ['Obra em etapas', 600, 'a4 i2', { sch: [[10, 'grandeObra']] }], ['Monitorar', 0, 'a-5 p-3']]);
ev('culGrande', CUL, 'centro', 0, 'Evento cultural de grande alcance', 'Um artista regional propõe um grande festival na cidade.', 2, [
  ['Sediar o festival', 700, 'c10 p9 t-1'], ['Apoio parcial', 250, 'c4 p3'], ['Recusar', 0, 'p-3']]);
ev('desastre', EME, 'bairros', 3, 'Vendaval e temporal', 'Um forte temporal destelhou casas e derrubou postes.', 2, [
  ['Resposta completa', 700, 'i5 p6 s1'], ['Atender só famílias mais afetadas', 250, 'i0 p2'], ['Aguardar apoio de fora', 0, 'i-6 p-7 s-2']]);
/* Crises por indicador baixo */
ev('crisSaude', SAUDE, 'bairros', 3, 'CRISE NA SAÚDE', 'A demanda aumentou enquanto a estrutura disponível permanece limitada.', 55, [
  ['Plano emergencial completo', 900, 's16 p6'], ['Contratação temporária', 350, 's8 p2'], ['Pedir ajuda externa', 40, 's1', { r: [.5, 's12 $300', 's-4 p-4'] }]], s => s.ind.s < 25);
ev('crisEdu', EDU, 'bairros', 3, 'CRISE NA EDUCAÇÃO', 'Escolas com problemas seguidos, evasão alta e queda no rendimento.', 55, [
  ['Plano emergencial de escolas', 850, 'e16 p6'], ['Reforço escolar e reparos', 320, 'e7 p2'], ['Adiar decisões', 0, 'e-6 p-6']], s => s.ind.e < 25);
ev('crisAgua', AGU, 'comunid', 3, 'CRISE DE ÁGUA', 'Reservatórios secam e comunidades ficam sem abastecimento regular.', 55, [
  ['Operação de emergência ampla', 850, 'a16 r6 p6'], ['Carros-pipa nas áreas críticas', 300, 'a7 r2'], ['Pedir apoio externo', 40, 'a1', { r: [.5, 'a12 $300', 'a-5 p-5'] }]], s => s.ind.a < 25);
ev('crisFin2', FIN, 'centro', 3, 'CRISE FINANCEIRA', 'O caixa está quase vazio e fornecedores ameaçam suspender serviços.', 70, [
  ['Corte forte de despesas', 0, 's-5 e-5 i-5 p-7 $700'], ['Renegociar dívidas e contratos', 60, 'p-3 t2 $300'], ['Buscar operação de crédito', 0, 'p-2 t-2 $900']], s => s.b < 1500);
ev('crisAdm', ADM, 'centro', 3, 'CRISE ADMINISTRATIVA', 'Vários serviços estão em situação crítica ao mesmo tempo e a prefeitura perde o controle da agenda.', 90, [
  ['Reorganizar toda a gestão', 700, 's6 e6 i6 a6 p6'], ['Focar em uma área só', 300, 'p2'], ['Manter a rotina', 0, 'p-8 t-3']], s => K.filter(k => k !== 'p' && s.ind[k] < 30).length >= 3);

/* Imprevistos leves */
const IMP = [['Uma árvore caiu durante a madrugada.', 'p-1 i-1'], ['Uma equipe conseguiu reduzir custos de uma obra.', '$120 p1'], ['Um projeto recebeu reconhecimento regional.', 'p3'],
  ['Uma unidade apresentou aumento inesperado na demanda.', 's-2'], ['Uma máquina da prefeitura apresentou defeito.', '$-80 i-1'], ['Moradores elogiaram a limpeza do centro.', 'p2'],
  ['Um vazamento foi consertado rapidamente.', 'a2 $-30'], ['Uma chuva leve aliviou a estiagem em algumas comunidades.', 'r2 a1']];
const MSG = { s:['Moradores elogiaram a melhoria na unidade de saúde.','Pacientes reclamam da precariedade no atendimento.'], e:['Pais e professores comemoraram as melhorias nas escolas.','Famílias demonstram preocupação com as escolas.'],
  i:['Motoristas notaram melhoria nas vias.','Moradores reclamam das condições das ruas.'], a:['Comunidades relatam melhora no acesso à água.','Moradores relatam dificuldade no abastecimento.'],
  c:['Comerciantes perceberam aquecimento nas vendas.','Comerciantes demonstraram insatisfação com o cenário econômico.'], r:['Comunidades rurais relatam melhora no acesso.','Produtores rurais reclamam do abandono no campo.'],
  t:['Cidadãos elogiaram a clareza na prestação de contas.','Moradores cobram mais transparência nos gastos.'], m:['Ambientalistas aprovaram a iniciativa.','Denúncias ambientais aumentaram.'] };
const BOOST = { 'Saúde':'s','Educação':'e','Infraestrutura':'i','Zona rural':'r','Água':'a','Meio ambiente':'m','Economia':'c','Transparência':'t','Finanças':'$','Mobilidade':'i','Cultura':'p' };


/* ---------- SORTEIO ---------- */
function pick() {
  const due = S.pending.findIndex(p => p.at <= S.turn);
  if (due >= 0) { const p = S.pending.splice(due, 1)[0]; S.chained = true; return EV.find(e => e.id === p.id); }
  S.chained = false;
  const rec = S.recent.slice(-5), D = DIFF[S.diff];
  const pool = EV.filter(e => e.p > 0 && !rec.includes(e.id) && (!e.w || e.w(S)));
  const ws = pool.map(e => {
    let w = e.p; const b = BOOST[e.cat];
    if (b === '$') { if (S.b < 3000) w *= 3; } else if (b && b !== 'p') { const v = S.ind[b]; if (v < 35) w *= 2.6; else if (v < 50) w *= 1.5; }
    w *= e.g >= 1 ? D.neg : 1 / D.neg;
    if (e.g === 0 && S.b < 2000) w *= .6;
    return w;
  });
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return pool[0];
}


function showEvent(e) {
  S.cur = e.id;
  hot(e.area);
  const kind = e.g >= 3 ? ['r', 'EMERGÊNCIA'] : e.g === 2 ? ['y', 'ATENÇÃO'] : e.g === 0 ? ['b', 'NOVA OPORTUNIDADE'] : ['b', 'NOVA OCORRÊNCIA'];
  toast(kind[0], kind[1], S.chained ? 'Uma decisão tomada há algumas rodadas está começando a produzir efeitos...' : e.t);
  const opts = e.o.map((o, i) => {
    const c = cost(o), ok = c <= S.b, risk = o[3] && o[3].r ? ' <small>Resultado incerto</small>' : '';
    return `<button class="opt" data-i="${i}" ${ok ? '' : 'disabled'}><span>${o[0]}${risk}${ok ? '' : '<small>Orçamento insuficiente</small>'}</span><b>${c ? fmt(c) : 'Sem custo'}</b></button>`;
  }).join('');
  const sev = ['Oportunidade', 'Ocorrência', 'Situação grave', 'Crise'][e.g];
  $('#modal').innerHTML = `<span class="tag g${e.g}">${sev}</span><span class="tag">${e.cat}</span>
    ${S.chained ? '<p><small>Uma decisão anterior voltou a aparecer...</small></p>' : ''}
    <h3>${e.t}</h3><div class="scn"><span class="big">${CI[e.cat] || '📋'}</span><div><b>${e.cat}</b><br><small>${AREA[e.area]}</small></div></div>
    <p class="say">${e.d}</p><div class="adv">${advisors(e)}</div><div id="opts">${opts}</div>`;
  openModal(true);
  document.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(e, +b.dataset.i));
  if (![...e.o].some(o => cost(o) <= S.b)) {
    $('#opts').innerHTML += '<button class="opt" id="noFunds"><span>Sem recursos: nada pode ser feito agora</span><b>Sem custo</b></button>';
    $('#noFunds').onclick = () => choose(e, -1);
  }
}


/* ---------- CONSEQUÊNCIAS ---------- */
function choose(e, i) {
  const o = i >= 0 ? e.o[i] : ['Sem recursos para agir', 0, 'p-4 t-1', {}];
  const x = o[3] || {}, c = cost(o), before = { ...S.ind };
  S.b -= c; S.spent += c; S.dec++; S.evs++; if (c === 0) S.zero++;
  S.catSpend[e.cat] = (S.catSpend[e.cat] || 0) + c;
  if (e.g === 3) { S.crises++; if (typeof polOnCrisis === 'function') polOnCrisis(3); }
  apply(fx(o[2]));
  if (e.id === 'chuvas' || e.id === 'chuvaBoa') S.rain = S.turn + 1;
  let extra = '';
  if (x.r) { const ok = Math.random() < x.r[0]; apply(fx(ok ? x.r[1] : x.r[2])); extra = ok ? 'O pedido foi aprovado e os recursos chegaram.' : 'O pedido não foi aprovado desta vez. O custo administrativo foi perdido.'; toast(ok ? 'g' : 'y', ok ? 'RESULTADO POSITIVO' : 'ATENÇÃO', extra); }
  (e.ifs || []).forEach(f => { if (S.flags[f[0]]) apply(fx(f[1])); });
  if (x.set) S.flags[x.set] = 1;
  if (e.id === 'estrada' && i === 0) delete S.flags.estradaNo;
  (x.sch || []).forEach(s => { if (!(s[1] === 'estradaPiora' && S.flags.estradaOk)) S.pending.push({ at: S.turn + s[0], id: s[1] }); });
  S.recent.push(e.id); if (S.recent.length > 8) S.recent.shift();
  S.yl.push({ y: year(), t: e.t, o: o[0], c, cat: e.cat, g: e.g });
  if (e.g >= 2 || c >= 500) S.tl.push({ y: year(), m: S.turn % 12, t: e.t + ' — ' + o[0] });
  const notes = K.filter(k => k !== 'p' && k !== 'm' || k === 'm').filter(k => Math.abs(S.ind[k] - before[k]) >= 5 && MSG[k]).slice(0, 2)
    .map(k => MSG[k][S.ind[k] > before[k] ? 0 : 1]);
  notes.forEach(feed);
  feed(`${e.t}: ${o[0]}${c ? ' (' + fmt(c) + ')' : ''}`);
  if (S.ind.p > before.p + 5) toast('g', 'RESULTADO POSITIVO', 'A população aprovou sua decisão.');
  const dp = S.ind.p - before.p;
  const head = dp >= 3 ? `Prefeitura recebe elogios após decisão sobre “${e.t}”` : dp <= -3 ? `Gestão é criticada por decisão sobre “${e.t}”` : `Prefeitura decide sobre “${e.t}” e a cidade aguarda os resultados`;
  if (e.g === 3) publishNews(NC[e.cat] || 'Cotidiano', `Problema na ${e.cat.toLowerCase()} aumenta pressão sobre Prefeitura`, e.d); else publishNews(NC[e.cat] || 'Prefeitura', head, o[0] + (c ? ' (' + fmt(c) + ')' : '') + '.');
  if (EVU[e.id]) unlock(EVU[e.id]);
  $('#modal').innerHTML = `<h3>Decisão registrada</h3><p><b>${o[0]}</b>${c ? ' — ' + fmt(c) : ''}</p>${extra ? '<p>' + extra + '</p>' : ''}
    <div class="news">📰 <b>Jornal do Sertão (fictício)</b><br>${head}</div>
    ${notes.length ? '<ul>' + notes.map(n => '<li>' + n + '</li>').join('') + '</ul>' : '<p>Os efeitos desta escolha ainda vão aparecer com o tempo.</p>'}
    <button class="btn main" id="okRes">Continuar</button>`;
  $('#okRes').onclick = () => {
    S.turn++; S.cur = null;
    if (S.turn % 12 === 0) S.bal = 1;
    save(); closeModal(); hot(null); render();
    if (S.bal) balance();
  };
  render();
}