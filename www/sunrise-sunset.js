var SunriseSunsetJS=function(t){"use strict";function n(t){return Math.sin(2*t*Math.PI/360)}function e(t){return 360*Math.acos(t)/(2*Math.PI)}function a(t){return Math.cos(2*t*Math.PI/360)}function r(t,n){var e=t%n;return e<0?e+n:e}function u(t,u,i,h,o){var M,c,f=function(t){return Math.ceil((t.getTime()-new Date(t.getFullYear(),0,1).getTime())/864e5)}(o),g=u/15,s=i?f+(6-g)/24:f+(18-g)/24,l=.9856*s-3.289,v=r(l+1.916*n(l)+.02*n(2*l)+282.634,360),D=.91764*(M=v,Math.tan(2*M*Math.PI/360));c=r(c=360/(2*Math.PI)*Math.atan(D),360),c+=90*Math.floor(v/90)-90*Math.floor(c/90),c/=15;var I,P=.39782*n(v),S=a((I=P,360*Math.asin(I)/(2*Math.PI))),w=(a(h)-P*n(t))/(S*a(t)),T=r((i?360-e(w):e(w))/15+c-.06571*s-6.622-u/15,24),d=Date.UTC(o.getFullYear(),o.getMonth(),o.getDate());return new Date(d+36e5*T)}return t.getSunrise=function(t,n){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:new Date;return u(t,n,!0,90.8333,e)},t.getSunset=function(t,n){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:new Date;return u(t,n,!1,90.8333,e)},t}({});