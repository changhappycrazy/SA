<?php
// 告訴瀏覽器這是一個 JSON 格式的檔案
header('Content-Type: application/json');

$data = [
  ["name"=>"生產者咖啡廳","lat"=>25.00338,"lon"=>121.46740,"address"=>"新北市板橋區忠孝路275號"],
  ["name"=>"點點甜甜","lat"=>25.01752,"lon"=>121.46167,"address"=>"新北市板橋區光正街45巷2弄2號"],
  ["name"=>"Coffee Maker","lat"=>25.00831,"lon"=>121.45819,"address"=>"新北市板橋區東門街30-2號"],
  ["name"=>"Merci créme","lat"=>25.01049,"lon"=>121.46342,"address"=>"新北市板橋區漢生東路43巷34號"],
  ["name"=>"KOYA Coffee","lat"=>25.02781,"lon"=>121.46997,"address"=>"新北市板橋區文化路二段125巷56號"]
];

echo json_encode($data);
?>