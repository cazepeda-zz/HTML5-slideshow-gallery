// general purpose HTML5 slideshow
// @zigotica

Slider = {
	options : {
		  duration : 1000
		, autoplay : 1
		, loop : 1
	}
	
	, go : function (index) {}
	, next : function () {}
	, prev : function () {}
	, random : function () {}
	, init : function () {
		$('figure img').forEach(function(el, i){
			if(i!=0) $(el).addClass('inactive')
		});
	}
}