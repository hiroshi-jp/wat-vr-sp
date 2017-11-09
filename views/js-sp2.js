// カメラ表示、Watson静止ロゴ＆説明表示
var startRecording = function(){
  // location.reload();
  $('#uploadFile').val('');
  $('#canvas').val('');
  $('#canvas2').val('');

  console.log("startRecording");
  scrollTo( 0, 0 ) ;  // とりあえず一番上にスクロール

  // 表示切替（カメラ）
  document.getElementById('recording').style="display:";
  document.getElementById('processing').style="display:none";
  document.getElementById('message').style="display:none";
  document.getElementById('again-x').style="display:none";

  // 表示切替（結果-1/メイン）
  document.getElementById('result').style="display:none";
  document.getElementById('gazou').style="display:none";
  // 表示切替（結果-2/その他）
  document.getElementById('result2').style="display:none";
  document.getElementById('again').style="display:none";

  // 表示切替（★Video/Canvas）
  document.getElementById('canvas').style="display:none";
  document.getElementById('canvas2').style="display:none";
}


// ファイルアップロード！！
$("#uploadFile").change(function() {

    // 画像をNode-REDに送る
    console.log("sendImageToNodeRED");
    // 表示切替（カメラ）
    document.getElementById('recording').style="display:none";
    document.getElementById('processing').style="display:";
    document.getElementById('message').style="display:none";
    document.getElementById('again-x').style="display:none";

    // 表示切替（結果-1/メイン）
    document.getElementById('result').style="display:none";
    document.getElementById('gazou').style="display:none";
    // 表示切替（結果-2/その他）
    document.getElementById('again').style="display:none";
    document.getElementById('result2').style="display:none";

    // 表示切替（★Video/Canvas）
    document.getElementById('canvas').style="width:100%;display:";


    // アップロードファイル取得
    var file = this.files[0];
    // console.log(file);
    var image = new Image();
    console.log("1");

    // 取得したファイルを、FileReaderオブジェクトで読み込む
    var reader = new FileReader();

    reader.onload = function(evt) {

      console.log("2");

      // 読み込んだ画像をCanvasに描画
      image.onload = function() {
        var options = {canvas:true};
        console.log("3");

        $("canvas").attr("width", image.width);
        $("canvas").attr("height", image.height);
        var canvas = $("#canvas");
        var ctx = canvas[0].getContext("2d");
        console.log("canvas = "+ canvas);

        // var canvas = document.getElementById('canvas');
        // console.log("canvas = "+ canvas);
        // var ctx = canvas.getContext("2d");

        ctx.drawImage(image,0,0);

        // 送信画像データの準備
        // Canvasに描画した画像をBase64データとして取得し直し
        console.log("canvas = "+ canvas);
        var dataURL = canvas[0].toDataURL('image/jpeg');  // DataURLに変換
        // console.log("dataURL: " + dataURL);
        var base64 = dataURL.replace(/^.*,/, '');     // プレフィックスを削除してBase64部分だけ取り出し
        // console.log("base64: " + base64);


        // Orientationの設定
                loadImage.parseMetaData(file, function (data) {
                  if (data.exif) {
                    options.orientation = data.exif.get('Orientation')

                    for( key in data.exif.map){
                        var value = data.exif[data.exif.map[key]];
                        if(value){
                            console.log(key + ':' + data.exif[data.exif.map[key]]); // Exif情報の出力
                        }
                    }
                  }
                  options.maxWidth = "100%";
                });

                loadImage(
                    file,
                    function (canvas) {
                      document.getElementById('canvas').style="display:none";
                      document.querySelector('div#hoge').appendChild(canvas).style.width = "100%"; // canvasの表示
                      document.querySelector('div#hoge').appendChild(canvas).id = "canvas2"; // canvasの表示
                    },
                    options // Options
                );
        // Orientationの設定



        var xhr= new XMLHttpRequest();                // Node-REDの呼び出し準備
        xhr.open("POST", "https://nodered-vr7.au-syd.mybluemix.net/vrnow2");
        xhr.onreadystatechange = function(e){         // コールバック関数
          if(xhr.readyState == 4){
            if(xhr.status == 200){
              console.log(xhr.responseText);

              var result = JSON.parse(xhr.responseText)
              console.log("displayResult" + result);

              var loc = "";
              if ('loc' in result) {
                // console.log("face_location: " + result.loc.left);
                ctx.strokeStyle = "pink";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(result.loc.left,result.loc.top);
                ctx.lineTo(result.loc.left+result.loc.width,result.loc.top);
                ctx.lineTo(result.loc.left+result.loc.width,result.loc.top+result.loc.height-30);
                ctx.lineTo(result.loc.left,result.loc.top+result.loc.height-30);
                ctx.closePath();
                ctx.stroke();
              }

              displayResult(JSON.parse(xhr.responseText));
            }else{
              console.log(e)
              console.log(xhr.responseText);
            }
          }
        };
        xhr.send(base64);   // Node-REDの呼び出し
    }

    // imageオブジェクトによるファイル読み込み
    console.log("4--image.src = evt.target.result");
    image.src = evt.target.result;
  }

  console.log("5--reader.readAsDataURL(file)");
  reader.readAsDataURL(file);
})



// Node-REDの結果を分析＆表示
var displayResult = function(result) {
  console.log("displayResult" + result);
  var age = "";
  var gender = "";

  // 人間の顔チェック！！
  if ('age' in result) {

    // 分類セット！！
    if ('classifiers' in result) {
      console.log("classifiers: " + result.classifiers);

      // JSON変数（降順にソート実施！）
      var cl = result.classifiers.array_numbers
      cl.sort(function(a,b){
        if(a.score>b.score) return -1;
        if(a.score<b.score) return 1;
        return 0;
      });
      console.log("cl: " + JSON.stringify(cl));

      // 結果表示
      document.getElementById('result').style="display:";
      score = cl[0].class + '  度： \t' + (cl[0].score * 100).toFixed(0)  + ' % !!';
      console.log("score-msg: " + score);
      document.getElementById('score').innerHTML = score;

      // 似た動物の画像リスト
      var imglist = {
                      イヌ: "./image/inu.png",
                      ネコ: "./image/neko.png",
                      クマ: "./image/kuma.png",
                      キリン: "./image/kirin.png",
                      インコ: "./image/inko.jpg"
                    };
      console.log("imglist: " + imglist);
      var gazou = imglist[ cl[0].class ];
      console.log("gazou: " + gazou);

      var gazou = '<img src=' + gazou + ' style="width:130px; height:130px">';
      document.getElementById('gazou').innerHTML = gazou;

      // var other="ほかにも・・・<br>"
      var other="";
      for (var i=1;i<cl.length;i++) {
        scoreadd = eval("cl[" + i + "].class") + '  度： \t' + (eval("cl[" + i + "].score") * 100).toFixed(0) + ' %';
        console.log(scoreadd);
        other = other + (scoreadd + "<br>");
      }
      document.getElementById('score2').innerHTML = other;


      // 表示切替（カメラ）
      document.getElementById('recording').style="display:none";
      document.getElementById('processing').style="display:none";
      document.getElementById('message').style="display:none";
      // 表示切替（結果）
      document.getElementById('result').style="display:";
      document.getElementById('gazou').style="display:";

      // setTimeout(() => {
        // 表示切替（その他）
        document.getElementById('again').style="display:";
        document.getElementById('result2').style="display:";
      // }, 2000);

    } else {
      // result---分類がなかった場合・・
      document.getElementById('message').innerHTML = "あなたは、動物に似てないかもです！<br>ごめんなさい！判定できなかったのでもう一度やり直してください！";

      // 表示切替（カメラ）
      document.getElementById('recording').style="display:none";
      document.getElementById('processing').style="display:none";
      // 表示切替（★変更）
      document.getElementById('message').style="display:";
      document.getElementById('again-x').style="display:";

      // 表示切替（結果）
      document.getElementById('result').style="display:none";
    }
  } else {
    // result---顔がビデオ撮影にない場合！
    document.getElementById('message').innerHTML = "カメラに顔表示されてないかもです！<br>ごめんなさい！判定できなかったのでもう一度やり直してください！";

    // 表示切替（カメラ）
    document.getElementById('recording').style="display:none";
    document.getElementById('processing').style="display:none";
    // 表示切替（★変更）
    document.getElementById('message').style="display:";
    document.getElementById('again-x').style="display:";

    // 表示切替（結果）
    document.getElementById('result').style="display:none";
  }
}


// メインロジック開始
startRecording();
