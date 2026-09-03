<?php
require_once __DIR__ . '/db.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function h($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function money($v): string { return 'R$ ' . number_format((float)$v, 2, ',', '.'); }
function app_base(): string { global $config; return rtrim($config['app']['base_url'] ?? '/area-segura', '/'); }
function redirect_to(string $path): never { header('Location: ' . app_base() . '/' . ltrim($path, '/')); exit; }
function csrf_token(): string { if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32)); return $_SESSION['csrf']; }
function csrf_field(): string { return '<input type="hidden" name="csrf" value="' . h(csrf_token()) . '">'; }
function verify_csrf(): void { if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) { http_response_code(419); exit('Sessão expirada ou requisição inválida.'); } }
function current_user(): ?array { return $_SESSION['user'] ?? null; }
function require_login(): void {
    global $config;
    if (!current_user()) redirect_to('index.php');
    $timeout = (int)($config['app']['session_timeout'] ?? 1800);
    if (!empty($_SESSION['last_activity']) && time() - $_SESSION['last_activity'] > $timeout) {
        session_unset(); session_destroy(); redirect_to('index.php?expired=1');
    }
    $_SESSION['last_activity'] = time();
}
function can_write(): bool { $u=current_user(); return $u && in_array($u['role'], ['admin','financeiro'], true); }
function require_write(): void { if (!can_write()) { http_response_code(403); exit('Seu perfil é somente consulta.'); } }
function audit(string $action, string $details=''): void {
    global $pdo;
    $uid = current_user()['id'] ?? null;
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $s = $pdo->prepare('INSERT INTO audit_logs(user_id,action,details,ip_address) VALUES(?,?,?,?)');
    $s->execute([$uid,$action,$details,$ip]);
}
function store_upload(string $field): ?array {
    global $config;
    if (empty($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) return null;
    $f = $_FILES[$field];
    if ($f['error'] !== UPLOAD_ERR_OK) throw new RuntimeException('Falha no envio do arquivo.');
    if ($f['size'] > (int)($config['app']['max_upload_bytes'] ?? 10485760)) throw new RuntimeException('Arquivo acima do limite permitido.');
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    $allowed = ['pdf','xml','jpg','jpeg','png','webp'];
    if (!in_array($ext,$allowed,true)) throw new RuntimeException('Tipo de arquivo não permitido.');
    $stored = bin2hex(random_bytes(20)) . '.' . $ext;
    $target = __DIR__ . '/storage/' . $stored;
    if (!move_uploaded_file($f['tmp_name'],$target)) throw new RuntimeException('Não foi possível armazenar o arquivo.');
    return ['original'=>$f['name'],'stored'=>$stored,'path'=>$target,'ext'=>$ext];
}
function parse_xml_invoice(string $path): array {
    $xml = @simplexml_load_file($path);
    if (!$xml) return [];
    $xp = function($expr) use ($xml) { $r=$xml->xpath($expr); return isset($r[0]) ? trim((string)$r[0]) : ''; };
    $number = $xp('//*[local-name()="nNF"][1]') ?: $xp('//*[local-name()="Numero"][1]');
    $series = $xp('//*[local-name()="serie"][1]') ?: $xp('//*[local-name()="Serie"][1]');
    $date = $xp('//*[local-name()="dhEmi"][1]') ?: $xp('//*[local-name()="dEmi"][1]') ?: $xp('//*[local-name()="DataEmissao"][1]');
    if ($date) $date = substr($date,0,10);
    $gross = $xp('//*[local-name()="vNF"][1]') ?: $xp('//*[local-name()="ValorServicos"][1]');
    $iss = $xp('//*[local-name()="vISS"][1]') ?: $xp('//*[local-name()="ValorIss"][1]');
    $inss = $xp('//*[local-name()="ValorInss"][1]');
    $irrf = $xp('//*[local-name()="vIRRF"][1]') ?: $xp('//*[local-name()="ValorIr"][1]');
    $pis = $xp('//*[local-name()="vPIS"][1]') ?: $xp('//*[local-name()="ValorPis"][1]');
    $cofins = $xp('//*[local-name()="vCOFINS"][1]') ?: $xp('//*[local-name()="ValorCofins"][1]');
    $csll = $xp('//*[local-name()="ValorCsll"][1]');
    return compact('number','series','date','gross','iss','inss','irrf','pis','cofins','csll');
}
