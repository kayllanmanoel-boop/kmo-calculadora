<?php
require __DIR__ . '/layout.php'; require_login();
$flash=''; $error='';
$reportId=(int)($_GET['report']??$_POST['report_id']??0);

try {
 if($_SERVER['REQUEST_METHOD']==='POST'){
   verify_csrf(); $action=$_POST['action']??'';
   if($action==='create_report'){
     require_write();
     $clientName=trim($_POST['client_name']??''); if(!$clientName) throw new RuntimeException('Informe o cliente/órgão.');
     $doc=trim($_POST['client_document']??''); $contract=trim($_POST['contract_no']??''); $obj=trim($_POST['object_text']??'');
     $s=$pdo->prepare('INSERT INTO clients(name,document,contract_no,object_text) VALUES(?,?,?,?)'); $s->execute([$clientName,$doc,$contract,$obj]); $clientId=(int)$pdo->lastInsertId();
     $title=trim($_POST['title']??'Prestação de Contas'); $period=trim($_POST['reference_period']??''); $opening=(float)str_replace(',','.',str_replace('.','',$_POST['opening_balance']??'0'));
     $s=$pdo->prepare('INSERT INTO account_reports(client_id,title,reference_period,opening_balance,created_by) VALUES(?,?,?,?,?)'); $s->execute([$clientId,$title,$period,$opening,current_user()['id']]); $reportId=(int)$pdo->lastInsertId();
     audit('criou prestação','Prestação #'.$reportId.' - '.$clientName); header('Location: '.app_base().'/prestacao.php?report='.$reportId.'&created=1'); exit;
   }
   if($action==='add_transaction'){
     require_write(); if(!$reportId) throw new RuntimeException('Selecione uma prestação de contas.');
     $type=$_POST['type']==='saida'?'saida':'entrada'; $date=$_POST['transaction_date']?:date('Y-m-d'); $desc=trim($_POST['description']??''); if(!$desc) throw new RuntimeException('Informe a descrição.');
     $amount=(float)str_replace(',','.',str_replace('.','',$_POST['amount']??'0')); if($amount<=0) throw new RuntimeException('Informe um valor maior que zero.');
     $up=store_upload('attachment');
     $s=$pdo->prepare('INSERT INTO transactions(report_id,type,transaction_date,description,party,document_no,payment_method,category,amount,attachment_original_name,attachment_storage_name,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
     $s->execute([$reportId,$type,$date,$desc,trim($_POST['party']??''),trim($_POST['document_no']??''),trim($_POST['payment_method']??''),trim($_POST['category']??''),$amount,$up['original']??null,$up['stored']??null,current_user()['id']]);
     audit('lançou '.$type,'Prestação #'.$reportId.' - '.money($amount).' - '.$desc); $flash='Movimentação registrada.';
   }
   if($action==='add_invoice'){
     require_write(); if(!$reportId) throw new RuntimeException('Selecione uma prestação de contas.');
     $up=store_upload('invoice_file'); $parsed=[]; if($up && $up['ext']==='xml') $parsed=parse_xml_invoice($up['path']);
     $num=trim($_POST['number']??'') ?: ($parsed['number']??''); $series=trim($_POST['series']??'') ?: ($parsed['series']??''); $date=$_POST['issue_date']??''; $date=$date ?: ($parsed['date']??date('Y-m-d'));
     $cv=function($key) use($parsed){ $raw=$_POST[$key]??''; if($raw==='') $raw=$parsed[$key]??'0'; return (float)str_replace(',','.',str_replace('.','',(string)$raw)); };
     $gross=$cv('gross'); $iss=$cv('iss'); $inss=$cv('inss'); $irrf=$cv('irrf'); $pis=$cv('pis'); $cofins=$cv('cofins'); $csll=$cv('csll'); $other=$cv('other_discount');
     if($gross<=0) throw new RuntimeException('Informe o valor bruto da nota fiscal.');
     $net=max(0,$gross-$iss-$inss-$irrf-$pis-$cofins-$csll-$other);
     $pdo->beginTransaction();
     $s=$pdo->prepare('INSERT INTO invoices(report_id,number,series,issue_date,gross_amount,iss,inss,irrf,pis,cofins,csll,other_discount,net_amount,source_original_name,source_storage_name,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
     $s->execute([$reportId,$num,$series,$date,$gross,$iss,$inss,$irrf,$pis,$cofins,$csll,$other,$net,$up['original']??null,$up['stored']??null,current_user()['id']]); $invoiceId=(int)$pdo->lastInsertId();
     $desc='Recebimento NF '.($num?:'#'.$invoiceId).' - valor líquido após retenções';
     $s=$pdo->prepare('INSERT INTO transactions(report_id,invoice_id,type,transaction_date,description,party,document_no,payment_method,category,amount,created_by) SELECT ?,?,\'entrada\',?,?,c.name,?,\'Transferência/Crédito\',\'Receita de NF\',?,? FROM account_reports r JOIN clients c ON c.id=r.client_id WHERE r.id=?');
     $s->execute([$reportId,$invoiceId,$date,$desc,$num,$net,current_user()['id'],$reportId]); $pdo->commit();
     audit('importou nota fiscal','Prestação #'.$reportId.' - NF '.$num.' - bruto '.money($gross).' - líquido '.money($net)); $flash='Nota registrada e entrada líquida criada automaticamente.';
   }
   if($action==='delete_transaction'){
     require_write(); $id=(int)($_POST['transaction_id']??0); $s=$pdo->prepare('SELECT * FROM transactions WHERE id=? AND report_id=?'); $s->execute([$id,$reportId]); $t=$s->fetch(); if(!$t) throw new RuntimeException('Lançamento não encontrado.');
     if($t['invoice_id']) throw new RuntimeException('Entrada vinculada a nota fiscal deve ser mantida para rastreabilidade.');
     if($t['attachment_storage_name']) @unlink(__DIR__.'/storage/'.$t['attachment_storage_name']);
     $pdo->prepare('DELETE FROM transactions WHERE id=?')->execute([$id]); audit('excluiu lançamento','Prestação #'.$reportId.' - lançamento #'.$id); $flash='Lançamento excluído.';
   }
   if($action==='finish_report'){
     require_write(); $pdo->prepare("UPDATE account_reports SET status='finalizada' WHERE id=?")->execute([$reportId]); audit('finalizou prestação','Prestação #'.$reportId); $flash='Prestação marcada como finalizada.';
   }
 }
}catch(Throwable $e){ if($pdo->inTransaction())$pdo->rollBack(); $error=$e->getMessage(); }

$reports=$pdo->query('SELECT r.*,c.name client_name,c.contract_no FROM account_reports r JOIN clients c ON c.id=r.client_id ORDER BY r.id DESC LIMIT 100')->fetchAll();
$report=null;$invoices=[];$transactions=[];$sumIn=0;$sumOut=0;$retained=0;$grossInvoices=0;
if($reportId){
 $s=$pdo->prepare('SELECT r.*,c.name client_name,c.document client_document,c.contract_no,c.object_text FROM account_reports r JOIN clients c ON c.id=r.client_id WHERE r.id=?');$s->execute([$reportId]);$report=$s->fetch();
 if($report){$s=$pdo->prepare('SELECT * FROM invoices WHERE report_id=? ORDER BY issue_date,id');$s->execute([$reportId]);$invoices=$s->fetchAll();$s=$pdo->prepare('SELECT * FROM transactions WHERE report_id=? ORDER BY transaction_date,id');$s->execute([$reportId]);$transactions=$s->fetchAll();foreach($transactions as $t){if($t['type']==='entrada')$sumIn+=(float)$t['amount'];else $sumOut+=(float)$t['amount'];}foreach($invoices as $n){$grossInvoices+=(float)$n['gross_amount'];$retained+=(float)$n['gross_amount']-(float)$n['net_amount'];}}
}
page_top('Prestação de Contas');
if(isset($_GET['created']))$flash='Prestação criada com sucesso.'; if($flash)echo '<div class="flash">'.h($flash).'</div>'; if($error)echo '<div class="error">'.h($error).'</div>';
?>
<div class="grid g2 no-print">
 <section class="card"><h2>Selecionar prestação</h2><p class="muted">Escolha um cliente/contrato já cadastrado.</p><select onchange="if(this.value)location.href='prestacao.php?report='+this.value"><option value="">Selecione...</option><?php foreach($reports as $r):?><option value="<?=$r['id']?>" <?=$reportId===$r['id']?'selected':''?>>#<?=$r['id']?> • <?=h($r['client_name'])?> • <?=h($r['reference_period'])?> • <?=h($r['status'])?></option><?php endforeach;?></select></section>
 <?php if(can_write()):?><section class="card"><h2>Nova prestação</h2><form method="post"><?=csrf_field()?><input type="hidden" name="action" value="create_report"><div class="grid g2"><div><label>Cliente / órgão</label><input name="client_name" required></div><div><label>CNPJ/CPF</label><input name="client_document"></div><div><label>Nº contrato</label><input name="contract_no"></div><div><label>Período</label><input name="reference_period" placeholder="Ex.: Agosto/2026"></div></div><label>Objeto / descrição</label><textarea name="object_text"></textarea><div class="grid g2"><div><label>Título</label><input name="title" value="Prestação de Contas"></div><div><label>Saldo inicial</label><input name="opening_balance" inputmode="decimal" value="0,00"></div></div><div class="actions"><button>Criar caderneta</button></div></form></section><?php endif;?>
</div>
<?php if($report): $balance=(float)$report['opening_balance']+$sumIn-$sumOut; ?>
<div class="section-title"><div><h2><?=h($report['client_name'])?></h2><div class="muted">Contrato <?=h($report['contract_no']?:'—')?> • <?=h($report['reference_period'])?> • Prestação #<?=$report['id']?> • <?=h($report['status'])?></div></div><div class="actions no-print"><a class="btn gold" href="relatorio.php?report=<?=$reportId?>" target="_blank">Emitir relatório / PDF</a><?php if(can_write()&&$report['status']==='aberta'):?><form method="post" style="display:inline"><?=csrf_field()?><input type="hidden" name="action" value="finish_report"><input type="hidden" name="report_id" value="<?=$reportId?>"><button class="light">Finalizar prestação</button></form><?php endif;?></div></div>
<div class="grid g4"><div class="card"><div class="muted">Notas fiscais (bruto)</div><div class="metric"><?=money($grossInvoices)?></div></div><div class="card"><div class="muted">Retenções / descontos</div><div class="metric red"><?=money($retained)?></div></div><div class="card"><div class="muted">Entradas efetivas</div><div class="metric green"><?=money($sumIn)?></div></div><div class="card"><div class="muted">Saídas</div><div class="metric red"><?=money($sumOut)?></div></div></div>
<div class="card" style="margin-top:15px"><div class="muted">SALDO ATUAL • saldo inicial <?=money($report['opening_balance'])?> + entradas - saídas</div><div class="metric <?=$balance<0?'red':'green'?>"><?=money($balance)?></div></div>
<?php if(can_write()&&$report['status']==='aberta'):?>
<div class="grid g2 no-print" style="margin-top:15px">
 <section class="card"><h3>Adicionar nota fiscal</h3><p class="muted">Ao salvar, o sistema cria automaticamente a entrada pelo valor líquido. XML de NF-e/NFS-e tenta preencher número, data, valor e retenções.</p><form method="post" enctype="multipart/form-data"><?=csrf_field()?><input type="hidden" name="action" value="add_invoice"><input type="hidden" name="report_id" value="<?=$reportId?>"><div class="grid g3"><div><label>Nº NF</label><input name="number"></div><div><label>Série</label><input name="series"></div><div><label>Data</label><input type="date" name="issue_date"></div></div><label>Arquivo da NF (XML/PDF/imagem)</label><input type="file" name="invoice_file" accept=".xml,.pdf,.jpg,.jpeg,.png,.webp"><div class="grid g4"><div><label>Valor bruto</label><input name="gross" inputmode="decimal"></div><div><label>ISS</label><input name="iss" inputmode="decimal"></div><div><label>INSS</label><input name="inss" inputmode="decimal"></div><div><label>IR/IRRF</label><input name="irrf" inputmode="decimal"></div><div><label>PIS</label><input name="pis" inputmode="decimal"></div><div><label>COFINS</label><input name="cofins" inputmode="decimal"></div><div><label>CSLL</label><input name="csll" inputmode="decimal"></div><div><label>Outros descontos</label><input name="other_discount" inputmode="decimal"></div></div><div class="actions"><button>Registrar NF e criar entrada</button></div></form></section>
 <section class="card"><h3>Lançar entrada ou saída manual</h3><form method="post" enctype="multipart/form-data"><?=csrf_field()?><input type="hidden" name="action" value="add_transaction"><input type="hidden" name="report_id" value="<?=$reportId?>"><div class="grid g2"><div><label>Tipo</label><select name="type"><option value="saida">Saída</option><option value="entrada">Entrada adicional</option></select></div><div><label>Data</label><input type="date" name="transaction_date" value="<?=date('Y-m-d')?>"></div></div><label>Descrição / finalidade</label><input name="description" required placeholder="Ex.: Pagamento fornecedor do coffee break"><div class="grid g2"><div><label>Pago a / recebido de</label><input name="party"></div><div><label>Documento / NF / recibo</label><input name="document_no"></div><div><label>Forma de pagamento</label><select name="payment_method"><option>PIX</option><option>Transferência</option><option>Boleto</option><option>Cartão</option><option>Dinheiro</option><option>Débito automático</option><option>Outro</option></select></div><div><label>Categoria</label><input name="category" placeholder="Alimentação, transporte, impostos..."></div></div><label>Valor</label><input name="amount" inputmode="decimal" required><label>Comprovante</label><input type="file" name="attachment" accept=".pdf,.xml,.jpg,.jpeg,.png,.webp"><div class="actions"><button class="gold">Adicionar movimentação</button></div></form></section>
</div>
<?php endif;?>
<div class="section-title"><h2>Notas fiscais e retenções</h2></div><div class="tablewrap"><table><thead><tr><th>Data</th><th>NF</th><th>Bruto</th><th>ISS</th><th>INSS</th><th>IR</th><th>PIS</th><th>COFINS</th><th>CSLL</th><th>Outros</th><th>Líquido</th><th>Arquivo</th></tr></thead><tbody><?php if(!$invoices):?><tr><td colspan="12">Nenhuma nota fiscal registrada.</td></tr><?php endif;foreach($invoices as $n):?><tr><td><?=h($n['issue_date'])?></td><td><?=h($n['number']?:'—')?></td><td><?=money($n['gross_amount'])?></td><td><?=money($n['iss'])?></td><td><?=money($n['inss'])?></td><td><?=money($n['irrf'])?></td><td><?=money($n['pis'])?></td><td><?=money($n['cofins'])?></td><td><?=money($n['csll'])?></td><td><?=money($n['other_discount'])?></td><td><b><?=money($n['net_amount'])?></b></td><td><?php if($n['source_storage_name']):?><a href="download.php?type=invoice&id=<?=$n['id']?>">Abrir</a><?php else:?>—<?php endif;?></td></tr><?php endforeach;?></tbody></table></div>
<div class="section-title"><h2>Entradas e saídas — rastreabilidade do dinheiro</h2></div><div class="tablewrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição / destino</th><th>Cliente / fornecedor</th><th>Documento</th><th>Pagamento</th><th>Categoria</th><th>Valor</th><th>Comprovante</th><th class="no-print"></th></tr></thead><tbody><?php if(!$transactions):?><tr><td colspan="10">Nenhuma movimentação registrada.</td></tr><?php endif;foreach($transactions as $t):?><tr><td><?=h($t['transaction_date'])?></td><td><span class="badge <?=$t['type']==='entrada'?'in':'out'?>"><?=h(strtoupper($t['type']))?></span></td><td><?=h($t['description'])?></td><td><?=h($t['party']?:'—')?></td><td><?=h($t['document_no']?:'—')?></td><td><?=h($t['payment_method']?:'—')?></td><td><?=h($t['category']?:'—')?></td><td><b><?=money($t['amount'])?></b></td><td><?php if($t['attachment_storage_name']):?><a href="download.php?type=transaction&id=<?=$t['id']?>">Abrir</a><?php else:?>—<?php endif;?></td><td class="no-print"><?php if(can_write()&&!$t['invoice_id']&&$report['status']==='aberta'):?><form method="post" onsubmit="return confirm('Excluir este lançamento?')"><?=csrf_field()?><input type="hidden" name="action" value="delete_transaction"><input type="hidden" name="report_id" value="<?=$reportId?>"><input type="hidden" name="transaction_id" value="<?=$t['id']?>"><button class="danger">Excluir</button></form><?php endif;?></td></tr><?php endforeach;?></tbody></table></div>
<?php endif; page_bottom();
