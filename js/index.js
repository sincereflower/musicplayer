$(function(){
    var player = $('#player');                 // 歌曲信息模块
    var playerContent1 = $('#player-content1');// 歌曲信息模块部分dom元素
    var musicName = $('.music-name');          // 歌曲名部分dom元素 
    var artistName = $('.artist-name');        // 歌手名部分dom元素
    var musicImgs = $('.music-imgs');          // 左侧封面图dom元素
    var playPauseBtn = $('.play-pause');       // 播放/暂停按钮 dom元素
    var playPrevBtn = $('.prev');              // 上一首按钮 dom元素
    var playNextBtn = $('.next')               // 下一首按钮 dom元素
    var volumeIcon = $('#volume');             // 音量按钮 dom元素
    var orderIcon = $('#order');               // 顺序按钮 dom元素
    var list = $('#list');                     // 列表按钮 dom元素
    var range = $('.range');                   // 音量range条 dom元素
    var panel = $('.panel');                   // 音量隐藏部分 dom元素        
    var numText = $('.text');                  // 显示的音量数字 dom元素
    var numText2 = $('.text2');                // 隐藏的音量数字 dom元素
    var time = $('.time');                     // 时间信息部分 dom元素
    var tProgress = $('.current-time');        // 当前播放时间文本部分 dom元素
    var totalTime = $('.total-time');          // 歌曲总时长文本部分 dom元素
    var sArea = $('#s-area');                  // 进度条部分
    var insTime = $('#ins-time');              // 鼠标移动至进度条上面，显示的信息部分
    var sHover = $('#s-hover');                // 鼠标移动至进度条上面，前面变暗的进度条部分
    var seekBar = $('#seek-bar');              // 播放进度条部分
    
    // 一些计算所需的变量
    var seekT, seekLoc, seekBarPos, cM, ctMinutes, ctSeconds, curMinutes, curSeconds, durMinutes, durSeconds, playProgress, bTime, realTimerange, volumeBL, isMove, isMove2, isHide = false, domOpacity = 10, nTime = 0;

    /* 歌曲列表功能还没做，可以上下拖动一首歌曲改变歌曲的先后顺序，歌曲数组随之实时改变 */
    // 想用来获取歌曲数组
    var musicStr = localStorage.getItem('music');
    if (musicStr != null) {
        var music = musicStr.replace(/[\r\n]/g,"").split(',');
    } else {
        // 歌曲mp3数组 歌曲文件名只能为 "歌手 - 歌曲名" 的格式(因为我的正则不长眼，如果你会改正则随意)
        // img下的图片名必须是歌曲名
        var music = [
            "佐咲紗花 - op.ogg",
            "佐咲紗花 - op_inst.ogg",
            "锦零、音阙诗听 - 空山新雨后.flac",
        ];
    }
    
    var musicUrls = [];      // 歌曲地址数组
    var musicImgsData = [];  // 图片地址数组
    var musicNameData = [];  // 歌曲名数组
    var artistNameData = []; // 歌手数组
    var reg = /([^]+(?= -))/;
    var reg2 = /([^-]+(?=\.))/;
    // 正则处理字符添加到对应数组
    for(var i = 0;i < music.length;i++){
        var url1 = 'mp3/' + music[i];
        var blue1 = music[i].match(reg)[1];
        var res = music[i].match(reg2)[1];
        var blue2 = res.substr(1, res.length);
        var url2 = 'img/' + blue2 + '.jpg';
        musicUrls.push(url1);
        artistNameData.push(blue1);
        musicNameData.push(blue2);
        musicImgsData.push(url2);
    }
    console.log(musicImgsData);

    var index = 1;                   // 播放模式索引,默认设为顺序播放
    var currIndex = -1;              // 当前播放索引
    var buffInterval = null          // 初始化定时器 判断是否需要缓冲
    var len = musicNameData.length;  // 歌曲长度

    // 鼠标拖动方法，(没怎么写过拖动，乱写一通)
    player.mousedown(function (e) { // 鼠标按下
        isMove = true;  // 判断是否随鼠标移动  true随鼠标移动  false不随鼠标移动
        isMove2 = true; // 判断是否正在随鼠标移动  true没有在移动  false正在移动
        $('.music-imgs, .play-pause, .prev, .next, .range, #volume, #order, #list, #s-area').mousemove(function(){
            if(isMove2){isMove = false;} // 没有在执行移动方法，鼠标在一些元素上时，不随鼠标移动
        })
        var w = e.clientX - this.offsetLeft;
        var h = e.clientY - this.offsetTop;
        var bodyWidth = document.body.clientWidth - player.width();     // 计算当前网页宽度
        var bodyHeight = document.body.clientHeight - player.height();  // 计算当前网页高度
        $(document).mousemove(function (e) { // 鼠标移动
            if (isMove) {
                isMove2 = false; // 正在执行移动方法，鼠标在一些元素上时，播放器随鼠标移动
                $('.icon, .btn').css({"cursor":"move"})
                player.css({"margin":0, "cursor":"move", "left":e.pageX - w, "top":e.pageY - h});
                if(player.offset().left < 0){
                    player.css({"left": 0});
                }
                if(player.offset().top < 0){
                    player.css({"top": 0});
                }
                if(player.offset().left > bodyWidth){
                    player.css({"left": bodyWidth});
                }
                if(player.offset().top > bodyHeight){
                    player.css({"top": bodyHeight});
                }
            }
        }).mouseup(function () { // 鼠标松开
            isMove = false;
            isMove2 = true;
            $('.icon, .btn').css({"cursor":"pointer"})
            player.css({"cursor":"default"});
        });
    });

    // 点击 播放/暂停 按钮，触发该函数
    // 作用：根据audio的paused属性 来检测当前音频是否已暂停  true:暂停  false:播放中
    function playPause(){
        if(audio.paused){
            playerContent1.addClass('active'); // 内容栏上移
            musicImgs.addClass('active');      // 左侧图片开始动画效果
            playPauseBtn.attr('class','btn play-pause icon-zanting iconfont') // 显示暂停图标
            checkBuffering(); // 检测是否需要缓冲
            audio.play();     // 播放
        }else{
            playerContent1.removeClass('active'); // 内容栏下移
            musicImgs.removeClass('active');      // 左侧图片停止旋转等动画效果
            playPauseBtn.attr('class','btn play-pause icon-jiediankaishi iconfont'); // 显示播放按钮
            clearInterval(buffInterval);          // 清除检测是否需要缓冲的定时器
            musicImgs.removeClass('buffering');    // 移除缓冲类名
            audio.pause(); // 暂停
        }  
    }

    // 鼠标移动在进度条上， 触发该函数	
	function showHover(event){
		seekBarPos = sArea.offset();    // 获取进度条长度
		seekT = event.clientX - seekBarPos.left;  //获取当前鼠标在进度条上的位置
		seekLoc = audio.duration * (seekT / sArea.outerWidth()); //当前鼠标位置的音频播放秒数： 音频长度(单位：s)*（鼠标在进度条上的位置/进度条的宽度）
		sHover.width(seekT);  //设置鼠标移动到进度条上变暗的部分宽度
		cM = seekLoc / 60;    // 计算播放了多少分钟： 音频播放秒速/60
		ctMinutes = Math.floor(cM);  // 向下取整
		ctSeconds = Math.floor(seekLoc - ctMinutes * 60); // 计算播放秒数
		
		if( (ctMinutes < 0) || (ctSeconds < 0) )
			return;
		
        if( (ctMinutes < 0) || (ctSeconds < 0) )
			return;
		
		if(ctMinutes < 10)
			ctMinutes = '0'+ctMinutes;
		if(ctSeconds < 10)
			ctSeconds = '0'+ctSeconds;
        
        if( isNaN(ctMinutes) || isNaN(ctSeconds) )
            insTime.text('--:--');
        else
		    insTime.text(ctMinutes+':'+ctSeconds);  // 设置鼠标移动到进度条上显示的信息
            
		insTime.css({'left':seekT,'margin-left':'-21px'}).fadeIn(0);  // 淡入效果显示
		
	}

    // 鼠标移出进度条，触发该函数
    function hideHover()
	{
        sHover.width(0);  // 设置鼠标移动到进度条上变暗的部分宽度 重置为0
        insTime.text('00:00').css({'left':'0px','margin-left':'0px'}).fadeOut(0); // 淡出效果显示
    }

    // 鼠标点击进度条，触发该函数
    function playFromClickedPos()
    {
        audio.currentTime = seekLoc; // 设置音频播放时间 为当前鼠标点击的位置时间
		seekBar.width(seekT);        // 设置进度条播放长度，为当前鼠标点击的长度
		hideHover();                 // 调用该函数，隐藏原来鼠标移动到上方触发的进度条阴影
    }

    // 在音频的播放位置发生改变是触发该函数
    function updateCurrTime()
	{
        nTime = new Date();      // 获取当前时间
        nTime = nTime.getTime(); // 将该时间转化为毫秒数

        // 计算当前音频播放的时间
		curMinutes = Math.floor(audio.currentTime  / 60);
        curSeconds = Math.floor(audio.currentTime  - curMinutes * 60);
        
		// 计算当前音频总时间
		durMinutes = Math.floor(audio.duration / 60);
        durSeconds = Math.floor(audio.duration - durMinutes * 60);
        
		// 计算播放进度百分比
		playProgress = (audio.currentTime  / audio.duration) * 100;
        
        // 如果时间为个位数，设置其格式
		if(curMinutes < 10)
			curMinutes = '0'+curMinutes;
		if(curSeconds < 10)
			curSeconds = '0'+curSeconds;
		
		if(durMinutes < 10)
			durMinutes = '0'+durMinutes;
		if(durSeconds < 10)
			durSeconds = '0'+durSeconds;
        
        if( isNaN(curMinutes) || isNaN(curSeconds) )
            tProgress.text('00:00');
        else
            tProgress.text(curMinutes+':'+curSeconds);
        
        if( isNaN(durMinutes) || isNaN(durSeconds) )
            totalTime.text('00:00');
        else
		    totalTime.text(durMinutes+':'+durSeconds);
        
        if( isNaN(curMinutes) || isNaN(curSeconds) || isNaN(durMinutes) || isNaN(durSeconds) )
            time.removeClass('active');
        else
            time.addClass('active');

        // 设置播放进度条的长度
		seekBar.width(playProgress+'%');
        
        // 进度条为100 即歌曲播放完时
		if( playProgress == 100 ){
            playPauseBtn.attr('class', 'btn play-pause icon-jiediankaishi iconfont'); // 显示播放按钮
			seekBar.width(0);              // 播放进度条重置为0
            tProgress.text('00:00');       // 播放时间重置为 00:00
            musicImgs.removeClass('buffering').removeClass('active');  // 移除相关类名
            clearInterval(buffInterval);   // 清除定时器
            if(index != 2){
                selectTrack(1);            // 添加这一句，可以实现自动播放          
            }
		}
    }

    // 定时器检测是否需要缓冲
    function checkBuffering(){
        clearInterval(buffInterval);
        buffInterval = setInterval(function(){ 
            // 这里如果音频播放了，则nTime为当前时间毫秒数，如果没播放则为0；如果时间间隔过长，也将缓存
            if( (nTime == 0) || (bTime - nTime) > 1000 ){ 
                musicImgs.addClass('buffering');  // 添加缓存样式类
            }else{
                musicImgs.removeClass('buffering'); // 移除缓存样式类
            }
            bTime = new Date();
            bTime = bTime.getTime();
        },1000);
    }
   
    // 点击上一首/下一首时，触发该函数。 
    // 注意：后面代码初始化时，会触发一次selectTrack(0)，因此下面一些地方需要判断flag是否为0
    function selectTrack(flag){
        if(index != 0){
            if( flag == 0 || flag == 1 ){  // 初始 || 点击下一首
                ++ currIndex;
                if(currIndex >= len){      // 当处于最后一首时，点击下一首，播放索引置为第一首
                    currIndex = 0;
                }
            }else{                         // 点击上一首
                -- currIndex;
                if(currIndex <= -1){       // 当处于第一首时，点击上一首，播放索引置为最后一首
                    currIndex = len - 1;
                }
            }
        }else{                             // index=0 随机播放
            randomplay();
            function randomplay(){
                var x = len;               // 随机数上限
                var y = 0;                 // 随机数下限
                var rand = parseInt(Math.random() * (x - y + 1) + y);
                if(currIndex == rand){console.log("重复了");randomplay()}else{currIndex = rand;} // 如果随机数和上一个索引一样，就重新执行，直到产生不一样的索引
            }
            if(currIndex >= len){ currIndex = 0; }
            if(currIndex <= -1){ currIndex = len - 1; }
        }
        
        if(flag == 0){
            playPauseBtn.attr('class','btn play-pause icon-jiediankaishi iconfont'); // 显示播放图标
        }else{
            musicImgs.removeClass('buffering');   
            playPauseBtn.attr('class','btn play-pause icon-zanting iconfont') // 显示暂停图标
        }

        seekBar.width(0);           // 重置播放进度条为0
        time.removeClass('active');
        tProgress.text('00:00');    // 播放时间重置
        totalTime.text('00:00');    // 总时间重置

        // 获取当前索引的:歌曲名，歌手名，图片，歌曲链接等信息
        currMusic = musicNameData[currIndex];
        currArtist = artistNameData[currIndex];
        currImg = musicImgsData[currIndex];
        audio.src = musicUrls[currIndex];
        
        nTime = 0;
        bTime = new Date();
        bTime = bTime.getTime();

        // 如果点击的是上一首/下一首 则设置开始播放，添加相关类名，重新开启定时器
        if(flag != 0){
            audio.play();
            playerContent1.addClass('active');
            musicImgs.addClass('active');
            clearInterval(buffInterval);
            checkBuffering();
        }

        // 设置网页title
        $("title").html(currMusic+' - '+currArtist+' ');
        
        // 将歌手名，歌曲名，图片链接，设置到元素上
        artistName.text(currArtist);
        musicName.text(currMusic);
        musicImgs.find('.img').attr("src", currImg);
    }

    // 切换播放顺序
    function sequence(){
        ++ index;
        switch(index){
            case 1:
                $('.text3').text('顺序播放')
                $('.icon-sequence').css({"background-position":"-80px -179px"})
                break
            case 2:
                audio.loop = true; // 循环播放为true, 歌曲播放完循环播放
                $('.text3').text('循环播放')
                $('.icon-sequence').css({"background-position":"-16px -179px"})
                break
            case 3:
                index = 0;
                audio.loop = false;
                $('.text3').text('随机播放')
                $('.icon-sequence').css({"background-position":"-144px -179px"})
        }
    }

    // 鼠标悬浮时显示/隐藏顺序
    function hideOrder(){
        setTimeout(() => { 
            if(orderIcon.is(":hover")){
                $('.text3').css({"display":"block"});
            }else{
                $('.text3').css({"display":"none"});
            }
        }, 1000)
    }

    // 设置音量值
    function setValue(){
        audio.volume = range[0].value / 100;
        numText.text(range[0].value + "%");
        numText2.text(range[0].value + "%");
    }
    
    // range拖动时改变音量和百分数
    function rangeDrag(){
        $('.icon-play').css({"background-position":"-80px -195px"});
        realTimerange = this.value;
        audio.volume = this.value / 100;
        numText.text(this.value + "%");
        numText2.text(this.value + "%");
        volumeBL = true;
        if(this.value == 0){
            $('.icon-play').css({"background-position":"-144px -195px"});
            volumeBL = false;
        }
    }

    // 点击图标静音和恢复音量
    function hideClick(){
        if(volumeBL){
            $('.icon-play').css({"background-position":"-144px -195px"});
            volumeBL = false;
            realTimerange = range[0].value; // 储存range[0].value当前值
            range[0].value = 0;
            setValue();
        }else{
            $('.icon-play').css({"background-position":"-80px -195px"});
            volumeBL = true;
            range[0].value = realTimerange;
            setValue();
        }
    }

    // 鼠标悬浮时显示/隐藏音量条
    function hide(){
        range.hover(() => {panel.css({"display":"block"});}, hide);
        setTimeout(() => {
            if(range.is(":hover") || volumeIcon.is(":hover")){
                panel.css({"display":"block"});
            }else{
                panel.css({"display":"none"});
            }
        }, 1000)
    }

    // 上下键显示/隐藏音量
    function hideKeyup(){
        if(range.is(":hover") || volumeIcon.is(":hover")){}else{
            panel.css({"display":"none"});
            numText2.fadeIn(10);
            var time = 0;
            var timeout = setInterval(() => {
                time++;
                if(time === 2 || volumeIcon.is(":hover")){ 
                    numText2.css({"display":"none"});
                    clearInterval(timeout); 
                }
                $(document).keydown((e) => { 
                    if(e.which === 38 || e.which === 40){
                        clearInterval(timeout)
                    } 
                });
            }, 1000);
        }
    }

    // 快捷键
    function shortcutKey(){
        $(document).keydown((e) => {
            if(e.which === 38){           // ↑音量加1%
                hideKeyup();
                var num = audio.volume * 100;
                if(num < 100){
                    num += 1;
                    if(num > 100){num = 100;}
                    range[0].value = num;
                    realTimerange = num;
                    $('.icon-play').css({"background-position":"-80px -195px"});
                    volumeBL = true;
                    setValue();
                }
            }else if(e.which === 40){       // ↓音量减1%
                hideKeyup();
                var num = audio.volume * 100;
                if(num > 0){
                    num -= 1;
                    if(num < 0){num = 0;}
                    range[0].value = num;
                    if(num == 0){$('.icon-play').css({"background-position":"-144px -195px"});volumeBL = false;}
                    setValue();
                }
            }else if(e.which === 190){      // 按【<】【>】可控制透明度，瞎写的
                if(domOpacity < 10){
                    ++ domOpacity;
                    player.css({"opacity": domOpacity / 10});
                }
            }else if(e.which === 188){
                if(domOpacity > 0){
                    -- domOpacity;
                    player.css({"opacity": domOpacity / 10});
                }
            }
        });
        $(document).keyup((e) => {
            // console.log(e.which);
            if(e.ctrlKey && e.which === 37){          // Ctrl + ← 上一首
                selectTrack(-1);
            }else if(e.ctrlKey && e.which === 39){    // Ctrl + → 下一首
                selectTrack(1);
            }else if(e.ctrlKey && e.which === 13){
                player.css({"left":0, "top":0, "margin":"25% auto"});  // Ctrl + Enter模块回到原位
            }else if(e.which === 13){                 // Enter切换播放顺序（方式），依次为列表顺序播放，单曲循环（当前音乐播放完后循环，点击按钮是可以下一首），随机播放
                sequence();
            }else if(e.which === 32){                 // 空格播放/暂停
                playPause();
            }else if(e.which === 46){                 // delete键控制歌曲模块的dispaly
                if(isHide == true){
                    isHide = false;
                    player.css({"display": "block"}); // 显示播放模块
                } else {
                    isHide = true;
                    player.css({"display": "none"});  // 隐藏播放模块
                }
            }
        });
    }

    // 初始化函数
    function initPlayer() {
        audio = new Audio();  // 创建Audio对象
		selectTrack(0);       // 初始化第一首歌曲的相关信息
        setValue();           // 初始化网页音量
        shortcutKey();        // 初始化快捷键
        volumeBL = true;      // 判断音量  false:音量0(静音)  true:有音量
        audio.loop = false;   // 取消歌曲的循环播放功能
        $('.text3').text('顺序播放');
        $(audio).on('timeupdate', updateCurrTime); // 实时更新播放时间

		// 进度条 移入/移出/点击 动作触发相应函数
		sArea.mousemove(function(event){ showHover(event) }); 
        sArea.mouseout(hideHover);
        sArea.on('click', playFromClickedPos);
        // 点击播放/暂停 按钮，触发playPause函数
        playPauseBtn.on('click', playPause);
        // 上下首切换
        playPrevBtn.on('click',function(){ selectTrack(-1) });
        playNextBtn.on('click',function(){ selectTrack(1) });

        // range拖动时改变音量和百分数
        range.on('input', rangeDrag);
        // 点击静音和恢复音量
        volumeIcon.on('click', hideClick);
        // 鼠标悬浮时显示/隐藏音量条
        volumeIcon.hover(() => { panel.css({"display":"block"}) }, hide);
        // 点击切换播放顺序 顺序播放,循环播放,随机播放
        orderIcon.on('click',sequence);
        // 鼠标悬浮时显示/隐藏顺序
        orderIcon.hover(() => { $('.text3').css({"display":"block"}) }, hideOrder);
        
        // 上传读取txt文本，想读写txt内容，发现不行，网页不能写入文件  (-_- 我先来：我是fw
        // $('.input_file').on('change', event => {
        //     let file = event.target.files[0];
        //     let file_reader = new FileReader();
        //     file_reader.onload = () => {
        //         let str = file_reader.result;
        //         localStorage.setItem('music', str);
        //         location.reload();
        //     };
        //     file_reader.readAsText(file, 'UTF-8');
        // });
    }
    // 调用初始化函数
    initPlayer();
});