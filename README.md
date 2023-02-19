# Input Value Check Plug-in

## License

* kintone-config-helper - https://github.com/kintone-labs/config-helper  
  MIT License https://opensource.org/licenses/MIT
* jQuery - https://jquery.com/  
  MIT License https://opensource.org/licenses/MIT
* 51-modern-default - https://developer.cybozu.io/hc/ja/articles/203302214  
  MIT License https://opensource.org/licenses/MIT

## Build package
kintone-plugin-packer --ppk ../ojdfalphhfkmbjaiociccmkcpploofij.ppk ../302bulk

## config setting
val : {
  lookup_code : 'contact_name'
  app_id : 1,
  mon_date:'2023-01-23',
  mon_prefix:'mon',
  tue_prefix:'tue',
  wed_prefix:'wed',
  thr_prefix:'thr',
  fri_prefix:'fri',
  sat_prefix:'sat',
  sun_prefix:'sun',
  absent:[ 
    { 0 : ['kin', 'leus']},
    {1:[]},
    {2:[]},
    {3:[]},
    {4:[]},
    {5:[]},
    {6:[]}
  ]
}