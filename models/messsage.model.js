const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const utils = require('../utils');
const errors = require('../utils/errors');
const Schema = mongoose.Schema;

const messageTypes = ['text', 'video', 'image', 'file' /* 'sound' */];

const fileMimetypes = [
  // 'application/envoy',
  // 'application/fractals',
  // 'application/futuresplash',
  // 'application/hta',
  // 'application/internet-property-stream',
  // 'application/mac-binhex40',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // 'application/x-dosexec',
  // 'application/octet-stream',
  // 'application/oda',
  // 'application/olescript',
  'application/pdf',
  // 'application/pics-rules',
  // 'application/pkcs10',
  // 'application/pkix-crl',
  // 'application/postscript',
  // 'application/rtf',
  // 'application/set-payment-initiation',
  // 'application/set-registration-initiation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  // 'application/vnd.ms-outlook',
  // 'application/vnd.ms-pkicertstore',
  // 'application/vnd.ms-pkiseccat',
  // 'application/vnd.ms-pkistl',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  // "text/html",
  'text/plain',
];

const videoMimetypes = [
  'application/vnd.apple.mpegurl',
  'application/x-mpegurl',
  'video/3gpp',
  'video/mp4',
  'video/mpeg',
  'video/ogg',
  'video/quicktime ',
  'video/webm',
  'video/x-m4v',
  'video/ms-asf',
  'video/x-ms-wmv',
  'video/x-msvideo',
  // 'video/x-la-asf',
  // 'video/x-ms-asf',
  // 'video/x-sgi-movie',
];

const imageMimetypes = [
  // 'image/bmp',
  // 'image/cis-cod',
  // 'image/gif',
  // 'image/ief',
  'image/jpeg',
  'image/jpg',
  'image/png',
  // 'image/pipeg',
  // 'image/svg+xml',
  // 'image/tiff',
  // 'image/x-cmu-raster',
  // 'image/x-cmx',
  // 'image/x-icon',
  // 'image/x-portable-anymap',
  // 'image/x-portable-bitmap',
  // 'image/x-portable-graymap',
  // 'image/x-portable-pixmap',
  // 'image/x-rgb',
  // 'image/x-xbitmap',
  // 'image/x-xpixmap',
  // 'image/x-xwindowdump,',
];

// const soundMimetype = {};
const fileMimetype = {
  // 'application/envoy': true, // Corel Envoy		.evy
  // 'application/fractals': true, // fractal image file		.fif
  // 'application/futuresplash': true, // Windows print spool file   .spl
  // 'application/hta': true, // HTML application		.hta
  // 'application/internet-property-stream': true, // Atari ST Program		.acx
  // 'application/mac-binhex40': true, // BinHex encoded file		.hqx
  'application/msword': true, // Word document		.doc .dot
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true, // Word document		.docx
  // 'application/x-dosexec': true, // executable file	.exe
  // 'application/octet-stream': true, // binary disk image		.bin, Java class file	 .class, Disk Masher image		.dms, LHARC compressed archive		.lha, LZH compressed file		.lzh,
  // 'application/oda': true, // CALS raster image		.oda
  // 'application/olescript': true, // ActiveX script		.axs
  'application/pdf': true, // Acrobat file		.pdf
  // 'application/pics-rules': true, // Outlook profile file		.prf
  // 'application/pkcs10': true, // certificate request file		.p10
  // 'application/pkix-crl': true, // certificate revocation list file		.crl
  // 'application/postscript': true, // Adobe Illustrator file		.ai, postscript file		.eps, postscript file		.ps
  // 'application/rtf': true, // rich text format file		.rtf
  // 'application/set-payment-initiation': true, // set payment initiation		.setpay
  // 'application/set-registration-initiation': true, // set registration initiation		.setreg
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true, // Excel Add-in file	 .xlxs
  'application/vnd.ms-excel': true, // Excel chart		.xlc .xlm .xls .xlt .xlw
  // 'application/vnd.ms-outlook': true, // Outlook mail message		.msg
  // 'application/vnd.ms-pkicertstore': true, // serialized certificate store file		.sst
  // 'application/vnd.ms-pkiseccat': true, // Windows catalog file		.cat
  // 'application/vnd.ms-pkistl': true, // stereolithography file		.stl
  'application/vnd.ms-powerpoint': true, // PowerPoint template		.pot .pps .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': true, // .pptx
  // Microsoft Project file	application/vnd.ms-project	mpp
  // WordPerfect macro	application/vnd.ms-works	wcm
  // Microsoft Works database	application/vnd.ms-works	wdb
  // Microsoft Works spreadsheet	application/vnd.ms-works	wks
  // Microsoft Works word processsor document	application/vnd.ms-works	wps
  // Windows help file	application/winhlp	hlp
  // binary CPIO archive	application/x-bcpio	bcpio
  // computable document format file	application/x-cdf	cdf
  // Unix compressed file	application/x-compress	z
  // gzipped tar file	application/x-compressed	tgz
  // Unix CPIO archive	application/x-cpio	cpio
  // Photoshop custom shapes file	application/x-csh	csh
  // Kodak RAW image file	application/x-director	dcr
  // Adobe Director movie	application/x-director	dir
  // Macromedia Director movie	application/x-director	dxr
  // device independent format file	application/x-dvi	dvi
  // Gnu tar archive	application/x-gtar	gtar
  // Gnu zipped archive	application/x-gzip	gz
  // hierarchical data format file	application/x-hdf	hdf
  // internet settings file	application/x-internet-signup	ins
  // IIS internet service provider settings	application/x-internet-signup	isp
  // ARC+ architectural file	application/x-iphone	iii
  // JavaScript file	application/x-javascript	js
  // LaTex document	application/x-latex	latex
  // Microsoft Access database	application/x-msaccess	mdb
  // Windows CardSpace file	application/x-mscardfile	crd
  // CrazyTalk clip file	application/x-msclip	clp
  // dynamic link library	application/x-msdownload	dll
  // Microsoft media viewer file	application/x-msmediaview	m13
  // Steuer2001 file	application/x-msmediaview	m14
  // multimedia viewer book source file	application/x-msmediaview	mvb
  // Windows meta file	application/x-msmetafile	wmf
  // Microsoft Money file	application/x-msmoney	mny
  // Microsoft Publisher file	application/x-mspublisher	pub
  // Turbo Tax tax schedule list	application/x-msschedule	scd
  // FTR media file	application/x-msterminal	trm
  // Microsoft Write file	application/x-mswrite	wri
  // computable document format file	application/x-netcdf	cdf
  // Mastercam numerical control file	application/x-netcdf	nc
  // MSX computers archive format	application/x-perfmon	pma
  // performance monitor counter file	application/x-perfmon	pmc
  // process monitor log file	application/x-perfmon	pml
  // Avid persistant media record file	application/x-perfmon	pmr
  // Pegasus Mail draft stored message	application/x-perfmon	pmw
  // personal information exchange file	application/x-pkcs12	p12
  // PKCS #12 certificate file	application/x-pkcs12	pfx
  // PKCS #7 certificate file	application/x-pkcs7-certificates	p7b
  // software publisher certificate file	application/x-pkcs7-certificates	spc
  // certificate request response file	application/x-pkcs7-certreqresp	p7r
  // PKCS #7 certificate file	application/x-pkcs7-mime	p7c
  // digitally encrypted message	application/x-pkcs7-mime	p7m
  // digitally signed email message	application/x-pkcs7-signature	p7s
  // Bash shell script	application/x-sh	sh
  // Unix shar archive	application/x-shar	shar
  // Flash file	application/x-shockwave-flash	swf
  // Stuffit archive file	application/x-stuffit	sit
  // system 5 release 4 CPIO file	application/x-sv4cpio	sv4cpio
  // system 5 release 4 CPIO checksum data	application/x-sv4crc	sv4crc
  // consolidated Unix file archive	application/x-tar	tar
  // Tcl script	application/x-tcl	tcl
  // LaTeX source document	application/x-tex	tex
  // LaTeX info document	application/x-texinfo	texi
  // LaTeX info document	application/x-texinfo	texinfo
  // unformatted manual page	application/x-troff	roff
  // Turing source code file	application/x-troff	t
  // TomeRaider 2 ebook file	application/x-troff	tr
  // Unix manual	application/x-troff-man	man
  // readme text file	application/x-troff-me	me
  // 3ds Max script file	application/x-troff-ms	ms
  // uniform standard tape archive format file	application/x-ustar	ustar
  // source code	application/x-wais-source	src
  // internet security certificate	application/x-x509-ca-cert	cer
  // security certificate	application/x-x509-ca-cert	crt
  // DER certificate file	application/x-x509-ca-cert	der
  // public key security object	application/ynd.ms-pkipko	pko
  'application/zip': true, // zipped file	application/zip	.zip
  // 'text/html': true, //
  'text/plain': true, //
};

const imageMimetype = {
  // 'image/bmp': true, // Bitmap		bmp
  // 'image/cis-cod': true, // compiled source code		cod
  // 'image/gif': true, // graphic interchange format		gif
  // 'image/ief': true, // image file		ief
  'image/jpeg': true, // JPEG image jpeg jpg jpe
  'image/jpg': true, // JPEG image jpeg jpg jpe
  'image/png': true, // .png
  // 'image/pipeg': true, // JPEG file interchange format		jfif
  // 'image/svg+xml': true, // scalable vector graphic		svg
  // 'image/tiff': true, // TIF image		tif  tiff
  // 'image/x-cmu-raster': true, // Sun raster graphic		ras
  // 'image/x-cmx': true, // Corel metafile exchange image file		cmx
  // 'image/x-icon': true, // icon		ico
  // 'image/x-portable-anymap': true, // portable any map image		pnm
  // 'image/x-portable-bitmap': true, // portable bitmap image		pbm
  // 'image/x-portable-graymap': true, // portable graymap image		pgm
  // 'image/x-portable-pixmap': true, // portable pixmap image		ppm
  // 'image/x-rgb': true, // RGB bitmap		rgb
  // 'image/x-xbitmap': true, // X11 bitmap		xbm
  // 'image/x-xpixmap': true, // X11 pixmap		xpm
  // 'image/x-xwindowdump': true, // X-Windows dump image		xwd
};

const videoMimetype = {
  'application/vnd.apple.mpegurl': true, // .m3u, .m3u8
  'application/x-mpegurl': true, // .m3u, .m3u8
  'video/3gpp': true, // .3gp
  'video/mp4': true, // .mp4, .m4a, .m4p, .m4b, .m4r, .m4v
  'video/mpeg': true, // MPEG-2 audio file  .m1v .mp2 .mpe .mpeg .mpg .mpa .mpv2 .mp4
  'video/ogg': true, // .ogg
  'video/quicktime ': true, // Apple QuickTime movie	.mov .mov, .qt
  'video/webm': true, // .webm
  'video/x-m4v ': true, // .m4v
  'video/ms-asf': true, // .asf, .wma, .wmv
  'video/x-ms-wmv': true, // .wmv
  'video/x-msvideo': true, // audio video interleave file .avi
  // 'video/x-la-asf': true, // Logos library system file .lsf .lsx
  // 'video/x-ms-asf': true, // advanced systems format file		.asf .asr .asx
  'video/x-sgi-movie': true, // Apple QuickTime movie		.movie
};

const getMessageFileType = (mimeType) => {
  if (_.includes(imageMimetypes, mimeType)) return 'image';
  if (_.includes(videoMimetypes, mimeType)) return 'video';
  if (_.includes(fileMimetypes, mimeType)) return 'file';

  throw errors.create(errors.BAD_REQUEST, {
    en: `invalid mime-type ${mimeType}`,
    th: `ไฟล์ประเภท ${mimeType} ไม่รองรับ`,
  });
};

function transformReply(m) {
  if (!!m.deleted) {
    return {
      id: m._id,
      _id: m._id,
      message: '',
      type: m.type,
      url: '',
      thumbnail_url: '',
      owner: m.owner,
      reply: m.reply || '',
      read: m.read,
      created: moment(m.created).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
      deleted: true,
      deleted_by: m.deleted_by,
      is_admin: m.is_admin,
    };
  } else {
    return {
      id: m._id,
      _id: m._id,
      property_id: m.property_id,
      message: m.message,
      type: m.type,
      url: m.url,
      thumbnail_url: m.thumbnail_url || m.url,
      owner: m.owner,
      reply: m.reply || '',
      read: m.read,
      created: moment(m.created).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
      deleted: false,
      deleted_by: '',
      is_admin: m.is_admin,
    };
  }
}

const messageSchema = new Schema(
  {
    message: { type: String, default: '' },
    type: {
      type: String,
      enum: messageTypes,
      default: 'text',
    },
    url: { type: String, default: '' },
    thumbnail_url: { type: String, default: '' },
    owner: {
      type: String,
      index: true,
      required: true,
    },
    is_admin: {
      type: Boolean,
      index: true,
      default: false,
    },
    admin_watched: {
      type: Boolean,
      index: true,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      index: true,
      default: 'active',
    },
    read: {
      type: Boolean,
      index: true,
      default: false,
    },
    created: {
      type: Date,
      index: true,
    },
    deleted: {
      type: Date,
      index: true,
    },
    deleted_by: {
      type: String,
    },
    reply: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Message',
    },
  },
  {
    toJSON: { virtuals: true },
  },
);

messageSchema.pre('save', function save(next) {
  try {
    if (!this.created) {
      this.created = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

messageSchema.method({
  async newMessage() {
    if (this.reply) {
      await this.populate({
        path: 'reply',
      }).execPopulate();
    }

    await this.save();
  },
  transform() {
    if (!!this.deleted) {
      return {
        id: this._id,
        _id: this._id,
        message: '',
        type: this.type,
        url: '',
        thumbnail_url: '',
        owner: this.owner,
        reply: _.isNil(this.reply) ? '' : transformReply(this.reply),
        read: this.read,
        created: moment(this.created).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
        deleted: true,
        deleted_by: this.deleted_by,
        is_admin: this.is_admin,
      };
    }

    return {
      id: this._id,
      _id: this._id,
      message: this.message,
      type: this.type,
      url: this.url,
      thumbnail_url: this.thumbnail_url || this.url,
      owner: this.owner,
      reply: _.isNil(this.reply) ? '' : transformReply(this.reply),
      read: this.read,
      created: moment(this.created).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
      deleted: false,
      deleted_by: '',
      is_admin: this.is_admin,
    };
  },
});

messageSchema.statics = {
  fileMimetypes,
  videoMimetypes,
  imageMimetypes,
  fileMimetype,
  videoMimetype,
  imageMimetype,
  getMessageFileType,
  transformReply,
  messageTypes,
};

const GroupMessage = mongoose.model('Message', messageSchema);

module.exports = GroupMessage;
