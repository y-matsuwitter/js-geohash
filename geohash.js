/*
Copyright (C) 2009 Hiroaki Kawai <kawai@iij.ad.jp>
*/

var geohash;
if(!geohash)geohash={};

geohash.base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
geohash.base32_map={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,b:10,c:11,d:12,e:13,f:14,g:15,h:16,j:17,k:18,m:19,n:20,p:21,q:22,r:23,s:24,t:25,u:26,v:27,w:28,x:29,y:30,z:31};

geohash._encode_i2c=function(lat,lng,lat_length,lng_length){
    var base32=geohash.base32.split('');
    var precision=(lat_length+lng_length)/5;
    if(lat_length < lng_length){
	var a=lng;
	var b= lat;
    }else{
	var a=lat;
	var b= lng;
    }
    var boost = [0,1,4,5,16,17,20,21];
    var ret = "";

    for(var i=0;i<precision;i++){
	ret+=base32[(boost[a&7]+(boost[b&3]<<1))&0x1F];
	var t = parseInt(a*Math.pow(2,-3));
	a=parseInt(b*Math.pow(2,-2));
	b=t;
    }

    return ret.split('').reverse().join('');
}

geohash.encode = function(lat,lng,precision){

    if(!precision)precision=12;
    if(lat>=90 || lat<=-90)return "";
    while(lng<-180.0)lng+=360.0;
    while(lng>=180.0)lng-=360.0;
    
    lat=lat/180.0;
    lng=lng/360.0;

    var xprecision=precision+1;
    var lat_length=parseInt(xprecision*5/2);
    var lng_length=parseInt(xprecision*5/2);

    if(xprecision%2==1)lng_length+=1;

    if(lat>0){
	lat=parseInt(Math.pow(2,lat_length)*lat+Math.pow(2,lat_length-1));
    }else{
	lat = Math.pow(2,lat_length-1)-parseInt(Math.pow(2,lat_length)*(-1.0*lat));
    }

    if(lng>0){
	lng=parseInt(Math.pow(2,lng_length)*lng+Math.pow(2,lng_length-1));
    }else{
	lng = Math.pow(2,lng_length-1)-parseInt(Math.pow(2,lng_length)*(-1.0*lng));
    }

    return geohash._encode_i2c(lat,lng,lat_length,lng_length).substring(0,precision);
    
};

geohash._decode_c2i=function(hashcode){
    var lng=0;
    var lat=0;
    
    var bit_length=0;
    var lat_length=0;
    var lng_length=0;
    var hash=hashcode.split('');
    
    for(var i=0;i<hash.length;i++){
	t=geohash.base32_map[hash[i]];
	if(bit_length%2==0){
	    lng=lng*8;
	    lat=lat*4;
	    lng += (t/4)&4;
	    lat += (t/4)&2
	    lng += (t/2)&2
	    lat += (t/2)&1
	    lng += t&1
	    lng_length+=3
	    lat_length+=2	    
	}else{
	    lng = lng*4
	    lat = lat*8
	    lat += (t/4)&4
	    lng += (t/4)&2
	    lat += (t/2)&2
	    lng += (t/2)&1
	    lat += t&1
	    lng_length+=2
	    lat_length+=3
	}
	bit_length+=5;
    }
    return [lat,lng,lat_length,lng_length]
};

geohash.decode=function(hashcode,delta){
    if(!delta)delta=false;
    data=geohash._decode_c2i(hashcode);
    var lat=data[0];
    var lng=data[1];
    var lat_length=data[2];
    var lng_length=data[3];

    lat = (lat*2) + 1
    lng = (lng*2) + 1
    lat_length += 1
    lng_length += 1
	
    var latitude  = 180.0*(lat-Math.pow(2,(lat_length-1)))/Math.pow(2,lat_length);
    var longitude = 360.0*(lng-Math.pow(2,(lng_length-1)))/Math.pow(2,lng_length);
    if(delta){
	var latitude_delta  = 180.0/Math.pow(2,lat_length);
	var longitude_delta = 360.0/Math.pow(2,lng_length);
	return [latitude,longitude,latitude_delta,longitude_delta];
    }
    return [latitude,longitude];
};

geohash.decode_exactly=function(hashcode){
    return geohash.decode(hashcode,true);
};

geohash.bbox=function(hashcode){
    var data=geohash._decode_c2i(hashcode);
    var lat=data[0];
    var lng=data[1];
    var lat_length=data[2];
    var lng_length=data[3];
    
    var ret={};

    if(lat_length){
	ret['n'] = 180.0*(lat+1-Math.pow(2,(lat_length-1)))/Math.pow(2,lat_length);
	ret['s'] = 180.0*(lat-Math.pow(2,(lat_length-1)))/Math.pow(2,lat_length);
    }else{
	ret['n'] = 90.0;
	ret['s'] = -90.0;
    }
    if(lng_length){
	ret['e'] = 360.0*(lng+1-Math.pow(2,(lng_length-1)))/Math.pow(2,lng_length);
	ret['w'] = 360.0*(lng-Math.pow(2,(lng_length-1)))/Math.pow(2,lng_length);
    }else{
	ret['e'] = 180.0;
	ret['w'] = -180.0;
    }
	
    return ret;
};
geohash.neighbors=function(hashcode){
    var data=geohash._decode_c2i(hashcode);
    var lat=data[0];
    var lng=data[1];
    var lat_length=data[2];
    var lng_length=data[3];

    var ret=[];
    var tlat=lat;
    var tlng=lng;

    ret.push(geohash._encode_i2c(tlat,tlng-1,lat_length,lng_length));
    ret.push(geohash._encode_i2c(tlat,tlng+1,lat_length,lng_length));

    tlat=lat+1;
    if(tlat>=0){
	ret.push(geohash._encode_i2c(tlat,tlng-1,lat_length,lng_length));
	ret.push(geohash._encode_i2c(tlat,tlng,lat_length,lng_length));
	ret.push(geohash._encode_i2c(tlat,tlng+1,lat_length,lng_length));
    }
    tlat=lat-1;
    if((tlat / Math.pow(2,lat_length))!=0){
	ret.push(geohash._encode_i2c(tlat,tlng-1,lat_length,lng_length));
	ret.push(geohash._encode_i2c(tlat,tlng,lat_length,lng_length));
	ret.push(geohash._encode_i2c(tlat,tlng+1,lat_length,lng_length));
    }
    return ret;
};
geohash.expand=function(hashcode){
    ret=geohash.neighbors(hashcode);
    ret.push(hashcode);
    return ret;
};
geohash.contain=function(lat,lng,hashcode){
    var data=geohash.bbox(hashcode);
    if(lat<data["n"] && lat >data["s"] && lng>data["w"] &&lng<data["e"])return true;
    return false;
};
geohash.contain_expand=function(lat,lng,hashcode){
    var data=geohash.expand(hashcode);
    for(var i=0;i<data.length;i++){
	if(geohash.contain(lat,lng,data[i]))return true;
    }
    return false;
}