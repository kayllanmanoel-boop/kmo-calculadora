<?php
require __DIR__ . '/auth.php';
if (current_user()) redirect_to('prestacao.php');
$error='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 verify_csrf();
 $email=strtolower(trim($_POST['email']??'')); $pass=$_POST['password']??'';
 $s=$pdo->prepare('SELECT * FROM users WHERE email=? AND active=1 LIMIT 1'); $s->execute([$email]); $u=$s->fetch();
 if($u && password_verify($pass,$u['password_hash'])){
   session_regenerate_id(true); $_SESSION['user']=['id'=>$u['id'],'name'=>$u['name'],'email'=>$u['email'],'role'=>$u['role']]; $_SESSION['last_activity']=time();
   $pdo->prepare('UPDATE users SET last_login=NOW() WHERE id=?')->execute([$u['id']]); audit('login','Acesso à área segura'); redirect_to('prestacao.php');
 }
 $error='E-mail ou senha inválidos.';
}
?><!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KMO | Área Segura</title><style>body{margin:0;font-family:Inter,Arial;background:linear-gradient(135deg,#08192f,#12345b);min-height:100vh;display:grid;place-items:center}.login{width:min(92%,420px);background:white;border-radius:20px;padding:28px;box-shadow:0 25px 60px #0004}.brand{font-size:24px;font-weight:900;color:#0b1f3a}.sub{color:#667085;margin:5px 0 20px}.field{margin:12px 0}label{display:block;font-size:13px;font-weight:700;margin-bottom:6px}input{width:100%;box-sizing:border-box;padding:13px;border:1px solid #cfd6e2;border-radius:11px;font-size:16px}button{width:100%;padding:13px;border:0;border-radius:11px;background:#0b1f3a;color:#fff;font-weight:800;font-size:16px}.err{background:#fff1f2;color:#b42318;padding:10px;border-radius:9px;margin-bottom:12px}.secure{text-align:center;color:#667085;font-size:12px;margin-top:16px}</style></head><body><main class="login"><div class="brand">KMO Gestão</div><div class="sub">Área Segura • Financeiro e Prestação de Contas</div><?php if($error):?><div class="err"><?=h($error)?></div><?php endif;?><form method="post"><?=csrf_field()?><div class="field"><label>E-mail</label><input type="email" name="email" required autocomplete="username"></div><div class="field"><label>Senha</label><input type="password" name="password" required autocomplete="current-password"></div><button>Entrar com segurança</button></form><div class="secure">Sessão protegida e com expiração automática.</div></main></body></html>
