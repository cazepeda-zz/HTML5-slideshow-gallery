// general purpose HTML5 slideshow
// @zigotica

Slider = {
	options : {
		  duration : 1000
		, autoplay : 1
		, loop : 1
		, active : 0
		, count : 0
		, playing : 0
		, timeout : null
	}
	
	, go : function (index) {
		if(index >= Slider.options.count) return;
		Slider.options.active = index;
		$('figure').forEach(function(el, i){
			if(i!=index) $(el).removeClass('active').addClass('inactive');
			else $(el).removeClass('inactive').addClass('active');
		});
	}
	, next : function () {
		if(Slider.options.active < Slider.options.count - 1) Slider.go(parseInt(Slider.options.active + 1));
		else if(Slider.options.loop == 1) Slider.go(0);
	}
	, prev : function () {
		if(Slider.options.active > 0) Slider.go(parseInt(Slider.options.active - 1));
		else if(Slider.options.loop == 1) Slider.go(Slider.options.count - 1);
	}
	, random : function () {
		var rnd = Math.round(Math.random()*(Slider.options.count - 1));
		if(rnd != Slider.options.active) Slider.go(rnd);
		else Slider.random();
	}
	, play : function () {
		if(Slider.options.playing == 1) return;
		Slider.options.timeout = setInterval(Slider.next, Slider.options.duration);
		Slider.options.playing = 1;
	}
	, pause : function () {
		clearTimeout(Slider.options.timeout);
		Slider.options.playing = 0;
	}
	, init : function () {
		$('figcaption').forEach(function(el, i){
			Slider.options.count++; 
			$(this).click( function(){
				if(i == Slider.options.active) return;
				Slider.go(i)
			});
		});
		Slider.go(0);
		if(Slider.options.autoplay == 1) Slider.play();
	}
}