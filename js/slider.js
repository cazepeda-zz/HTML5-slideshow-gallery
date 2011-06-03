// general purpose HTML5 slideshow
// @zigotica

Slider = {
	options : {
		  duration : 1000
		, autoplay : 1
		, loop : 1
	}
	
	, go : function (index) {
		$('figure').forEach(function(el, i){
			if(i!=index) $(el).removeClass('active').addClass('inactive');
			else $(el).removeClass('inactive').addClass('active');
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