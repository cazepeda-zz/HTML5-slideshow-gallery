// general purpose HTML5 slideshow
// @zigotica

Slider = {
	options : {
		  duration : 1000
		, autoplay : 1
		, loop : 1
		, active : 0
		, count : 0
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
	}
	, prev : function () {
		if(Slider.options.active > 0) Slider.go(parseInt(Slider.options.active - 1));
	}
	, random : function () {
		var rnd = Math.round(Math.random()*(Slider.options.count - 1));
		if(rnd != Slider.options.active) Slider.go(rnd);
		else Slider.random();
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
	}
}