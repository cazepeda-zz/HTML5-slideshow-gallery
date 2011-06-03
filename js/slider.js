// general purpose HTML5 slideshow
// @zigotica

Slider = {
	options : {
		  duration : 1000
		, autoplay : 1
		, loop : 1
	}
	
	, go : function (index) {
		$('figure img').forEach(function(el, i){
			if(i!=index) $(el).addClass('inactive');
			else $(el).removeClass('inactive');
		});
		$('figcaption').forEach(function(el, i){
			if(i!=index) $(el).removeClass('active');
			else $(el).addClass('active');
		});
		console.log(index);
	}
	, next : function () {}
	, prev : function () {}
	, random : function () {}
	, init : function () {
		Slider.go(0);
		$('figcaption').forEach(function(el, i){
			$(this).click( function(){
				Slider.go(i)
			});
		});
		
	}
}