function Adjust(X,Y,x,y,z,w)
{
var offset=268435456;
var radius=offset/Math.PI;

function LToX(x)
{
return Math.round(offset+radius*x*Math.PI/180);
}

function LToY(y)
{
return Math.round(offset-radius*Math.log((1+Math.sin(y*Math.PI/180))/(1-Math.sin(y*Math.PI/180)))/2);
}

function XToL(x)
{
return ((Math.round(x)-offset)/radius)*180/Math.PI;
}

function YToL(y)
{
return (Math.PI/2-2*Math.atan(Math.exp((Math.round(y)-offset)/radius)))*180/Math.PI;
}

if (w)
{
return {x:(LToX(X)-LToX(x))>>(21-z),y:(LToY(Y)-LToY(y))>>(21-z)};
}

else
{
return {x:XToL(LToX(x)+(X<<(21-z))),y:YToL(LToY(y)+(Y<<(21-z)))};
}
}

function XYToLL(X,Y,x,y,z){return Adjust(X,Y,x,y,z,0)}

// X = X pixel offset of new map center from old map center
// Y = Y pixel offset of new map center from old map center
// x = Longitude of map center
// y = Latitude of map center
// z = Zoom level

// result.x = Longitude of adjusted map center
// result.y = Latitude of adjusted map center

function LLToXY(X,Y,x,y,z){return Adjust(X,Y,x,y,z,1)}

// X = Longitude of marker center
// Y = Latitude of marker center
// x = Longitude of map center
// y = Latitude of map center
// z = Zoom level

// result.x = X pixel offset of marker center from map center
// result.y = Y pixel offset of marker center from map center