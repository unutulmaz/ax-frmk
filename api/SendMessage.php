<?php
require_once vendor_path('PHPMailer/PHPMailerAutoload.php');
require_once vendor_path('PHPMailer/class.phpmailer.php');
require_once vendor_path('PHPMailer/class.smtp.php');
require_once vendor_path('PHPMailer/class.pop3.php');

class SendMessage
{
   public $config;

   public function __construct($config = null)
   {
       if (isset($contfig)) $this->config = $config;
       else {
           $this->config['Host'] = env('MAIL_HOST');
           $this->config['Port'] = env('MAIL_PORT');
           $this->config['Username'] = env('MAIL_USERNAME');
           $this->config['Password'] = env('MAIL_PASSWORD');

       }
       if (!isset($this->config['Username'])) throw new \Exception("No Username was set as From!");
       if (!isset($this->config['Password'])) throw new \Exception("No Password was set as From!");
       if (!isset($this->config['Host'])) throw new \Exception("No Host was set as From!");
   }

   /**
    * @var EmailItem
    */
   public $From;

   public function setFrom($email, $name)
   {
       $this->From = new EmailItem($email, $name);
   }

   /**
    * @var EmailItem
    */
   public $ReplyTo = [];

   public function addReplyTo($email, $name)
   {
       $this->ReplyTo[] = new EmailItem($email, $name);
   }

   /**
    * @var EmailItem
    */
   public $CC = [];

   public function addCC($email, $name)
   {
       $this->CC[] = new EmailItem($email, $name);
   }

   /**
    * @var EmailItem
    */
   public $BCC = [];

   public function addBCC($email, $name)
   {
       $this->BCC[] = new EmailItem($email, $name);
   }

   /**
    * @var EmailItem[]
    */
   public $To = array();

   public function AddTo($email, $name)
   {
       $overwrite = env('MAIL_TO_OVERWRITE');
       if (!$overwrite) $this->To[] = new EmailItem($email, $name);
       else {
           $this->To[] = new EmailItem($overwrite, $overwrite);
       }
   }

   public $Subject = "";
   public $HtmlBody = "";
   /**
    * @var AttachmentFile[]
    */
   public $Attachments = array();

   public function AddAttachment($path, $name, $encoding = 'base64', $type = 'application/pdf')
   {
       if (!file_exists($path)) throw new \Exception("Attachment file {$path} doesn't not exist!");
       $name = str_replace(':'," ", $name);
       $name = str_replace(' ', "_", $name);
       $this->Attachments[] = new AttachmentFile($path, $name, is_null($encoding) ? 'base64' : $encoding, is_null($type) ? 'application/pdf' : $type);
   }

   public function send()
   {
       $debugLevel = 0;
// $debugLevel = 0;
//   $pop = new POP3();
//   $connected = $pop->Authorise($email['Host'], $email["Port"], 10, $email['Username'], $email['Password'], $debug = $debugLevel);
//   if (!$connected) return false;
       /**
        * var PHPMailer
        */

       $mail = new \PHPMailer(true);
       $mail->SMTPDebug = $debugLevel;
       $mail->SMTPAuth = true;
       $mail->IsSMTP();
       $mail->Host = $this->config['Host'];
       $mail->Port = $this->config['Port'];
       $mail->Username = $this->config['Username'];
       $mail->Password = $this->config['Password'];
       $mail->CharSet = "UTF-8";
       $mail->ContentType = 'text/html; charset=utf-8\r\n';
       $mail->Encoding = '8bit';
       if (!isset($this->From)) throw new \Exception("From member of msg is not set!");
       $mail->SetFrom($this->From->email, $this->From->name);

       if (isset($this->ReplyTo)) {
           foreach ($this->ReplyTo as $contact) {
               $mail->addReplyTo($contact->email, $contact->name);
           }
       };

       if (isset($this->CC)) {
           foreach ($this->CC as $contact) {
               $mail->addCC($contact->email, $contact->name);
           }
       }

       if (isset($this->BCC)) {
           foreach ($this->BCC as $contact) {
               $mail->addBCC($contact->email, $contact->name);
           }
       }

       if (!isset($this->Subject)) throw new \Exception("No subject was set for msg!");
       $mail->Subject = $this->Subject;

       if (!isset($this->HtmlBody)) throw new \Exception("No HtmlBody was set for msg!");
       $mail->MsgHTML($this->HtmlBody);

       if (!isset($this->To)) throw new \Exception("To member of msg is not set!");
       foreach ($this->To as $contact) {
           $mail->AddAddress($contact->email, $contact->name);
       }

       if (isset($this->Attachments)) {
           foreach ($this->Attachments as $attachment) {
               $mail->AddAttachment($attachment->path, $attachment->name, $attachment->encoding, $attachment->type);
           }
       }
       $result = $mail->Send();
       if ($result) return "OK";
       else return "ERROR";

   }
}

class EmailItem
{
   public $email;
   public $name;

   public function __construct($email, $name)
   {
       $this->email = $email;
       $this->name = $name;
   }
}

class AttachmentFile
{
   public $name = "";
   public $path = "";
   public $encoding = "";
   public $type = "";

   public function __construct($path, $name, $encoding = 'base64', $type = 'application/octet-stream')
   {
       $this->path = $path;
       $this->name = $name;
       $this->encoding = $encoding;
       $this->type = $type;
   }
}
