<?php
require __DIR__.'/auth.php'; require_login();
$type=$_GET['type']??''; $id=(int)($_GET['id']??0);
if($type==='invoice'){$s=$pdo->prepare('SELECT source_original_name original_name,source_storage_name storage_name FROM invoices WHERE id=?');}
elseif($type==='transaction'){$s=$pdo->prepare('SELECT attachment_original_name original_name,attachment_storage_name storage_name FROM transactions WHERE id=?');}
else{http_response_code(400);exit('Arquivo inválido.');}
$s->execute([$id]);$f=$s->fetch();if(!$f||!$f['storage_name']){http_response_code(404);exit('Arquivo não encontrado.');}
$path=__DIR__.'/storage/'.basename($f['storage_name']);if(!is_file($path)){http_response_code(404);exit('Arquivo não encontrado.');}
audit('baixou arquivo',$type.' #'.$id);$mime=mime_content_type($path)?:'application/octet-stream';header('Content-Type: '.$mime);header('Content-Length: '.filesize($path));header('Content-Disposition: inline; filename="'.rawurlencode($f['original_name']?:basename($path)).'"');readfile($path);
