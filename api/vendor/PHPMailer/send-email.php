<?php
include_once $_SERVER['DOCUMENT_ROOT'] . '\api\vendor\PHPMailer\class.phpmailer.php';
include_once $_SERVER['DOCUMENT_ROOT'] . '\api\vendor\PHPMailer\class.smtp.php';
include_once $_SERVER['DOCUMENT_ROOT'] . '\api\vendor\PHPMailer\class.pop3.php';



function sendMail(){
	global $email, $errors;
	addError("global", "- Mesajul nu a putut fi trimis!");
	$result= 0;

	$debugLevel = 0;
	$pop = new POP3();
	$pop->Authorise($email['Host'], $email["Port"], 10, $email['Username'], $email['Password'], $debug=$debugLevel );
	$mail = new PHPMailer(true);
	$mail->SMTPDebug  = $debugLevel ;
	$mail->SMTPAuth = true;
	$mail->IsSMTP();
	$mail->Host = $email['Host'];
	$mail->Username = $email['Username'];
	$mail->Password = $email['Password'];
	$mail->CharSet = "UTF-8";
	$mail->ContentType = 'text/html; charset=utf-8\r\n';
	$mail->Encoding    = '8bit';
	$mail->SetFrom($email['SetFrom']['email'], $email['SetFrom']['name']);
	$mail->AddReplyTo($email['AddReplyTo']['email'], $email['AddReplyTo']['name']);
	$mail->AddCC($email['AddReplyTo']['email'], $email['AddReplyTo']['name']);
	$mail->Subject = $email['Subject'];
	$mail->MsgHTML($email['MsgHTML']);
	$mail->AddAddress($email['To']['email'], $email['To']['name']);
	$result = $mail->Send();
	if ($result) {
		unset($errors["global"]);
		return 1;
	}
	return 0;
}
function addError($field, $message){
	global $errors;
	if ($field == "global") {
		if( !isset( $errors[$field])) $errors[$field]=[];
		$errors[$field][] = $message;
	}else  $errors[$field] = $message;
}