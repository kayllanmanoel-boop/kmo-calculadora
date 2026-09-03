<?php
require __DIR__ . '/db.php';
$error=''; $done=false;
try {
  $sql=file_get_contents(__DIR__.'/schema.sql');
  foreach(array_filter(array_map('trim',preg_split('/;\s*(?:\r?\n|$)/',$sql))) as $stmt){ $pdo->exec($stmt); }
  $count=(int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
  if($count>0){ $done=true; }
  elseif($_SERVER['REQUEST_METHOD']==='POST'){
    $name=trim($_POST['name']??''); $email=strtolower(trim($_POST['email']??'')); $pass=$_POST['password']??'';
    if(!$name||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($pass)<8) throw new RuntimeException('Informe nome, e-mail válido e senha com pelo menos 8 caracteres.');
    $s=$pdo->prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,\'admin\')');
    $s->execute([$name,$email,password_hash($pass,PASSWORD_DEFAULT)]); $done=true;
  }
}catch(Throwable $e){$error=$e->getMessage();}
?><!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KMO - Instalação</title><style>body{font-family:Arial;background:#f4f7fb;margin:0;color:#172033}.box{max-width:560px;margin:60px auto;background:#fff;padding:28px;border-radius:18px;border:1px solid #e2e8f0}input,button{width:100%;padding:13px;margin:7px 0;border-radius:10px;border:1px solid #cbd5e1;font-size:16px}button{background:#0b1f3a;color:white;font-weight:700}.ok{background:#ecfdf3;padding:15px;border-radius:10px}.err{background:#fff1f2;padding:15px;border-radius:10px}</style></head><body><div class="box"><h1>Área Segura KMO</h1><?php if($done): ?><div class="ok">Instalação concluída. Por segurança, remova ou renomeie <b>setup.php</b> depois do primeiro acesso.<br><br><a href="index.php">Entrar na Área Segura</a></div><?php else: ?><?php if($error):?><div class="err"><?=htmlspecialchars($error)?></div><?php endif;?><p>Crie o primeiro usuário administrador.</p><form method="post"><input name="name" placeholder="Nome" required><input type="email" name="email" placeholder="E-mail" required><input type="password" name="password" placeholder="Senha (mín. 8 caracteres)" required><button>Criar administrador</button></form><?php endif;?></div></body></html>
