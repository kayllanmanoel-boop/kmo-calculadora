<?php
require __DIR__ . '/auth.php';
if(current_user()) audit('logout','Saída da área segura');
session_unset(); session_destroy(); redirect_to('index.php');
