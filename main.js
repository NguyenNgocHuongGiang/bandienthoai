const express = require('express')
const { engine } = require('express-handlebars');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const flash = require('connect-flash');

const app = express()

app.set('view engine', 'handlebars')

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    res.locals.flashMessage = req.session.flashMessage;
    delete req.session.flashMessage;
    next();
});
app.use(express.static("./public"))
app.use(flash());

app.engine('handlebars', engine({
    extname: '.hbs', defaultLayout: "main", helpers: {}
}));

var products = [
    { id: 1, name: 'iPhone XS', image: "/img/image1.png", price: '1199', mota: 'Xs Max xứng đáng là chiếc iPhone cao cấp nhất của Apple trong thời điểm hiện tại khi sở hữu lối thiết kế vô cùng tinh và thu hút với những đường cong mềm mại, đặc trưng và đầy tính biểu tượng từ những chiếc iPhone tiền nhiệm. Phần khung viền của iPhone Xs Max được làm từ thép không gỉ, mặt lưng là kính cường lực vừa đảm bảo tính thẩm mỹ cao vừa tạo sự an toàn tuyệt đối cho thiết bị.' },
    { id: 2, name: 'iPhone 12 Pro', image: '/img/image2.png', price: '1399', mota: 'Công nghệ màn hình trên 12 Pro Max cũng được đổi mới và trang bị tốt hơn cùng kích thước lên đến 6.7 inch, lớn hơn so với điện thoại iPhone 12 thường. Với công nghệ màn hình OLED cho khả năng hiển thị hình ảnh lên đến 2778 x 1284 pixels. Bên cạnh đó, màn hình này còn cho độ sáng tối đa cao nhất lên đến 800 nits, luôn đảm bảo cho bạn một độ sáng cao và dễ nhìn nhất ngoài nắng.' },
    { id: 3, name: 'Macbook Pro 13" M1', image: '/img/image3.png', price: '1299', mota: 'Vẫn kế thừa thiết kế từ người tiềm nhiệm trước đó của mình, Macbook Pro 13 M1 vẫn sở hữu thiết kế nhôm nguyên khối, các đường viền trên máy được cắt CNC tỉ mỉ, sắc xảo. Macbook Pro 13 M1 sở hữu màn hình Retina 13.3 inches sắc nét, tấm nền LED mang đến màu đen sâu. Hỗ trợ dải màu rộng P3, công nghệ True Tone cân bằng màu trắng tự động để phù hợp với nhiệt độ màu của ánh sáng tự nhiên xung quanh, đem đến trải nghiệm hiển thị tự nhiên nhất.' },
    { id: 4, name: 'Airpod Pro', image: '/img/image4.png', price: '499', mota: 'Tương tự như trên các dòng iPhone, Apple cũng sử dụng chung thiết kế cho nhiều dòng AirPods của mình. Thế hệ AirPods mới này sẽ tiếp tục sở hữu thiết kế của người tiền nhiệm khi ngoại hình thiết bị không có quá nhiều thay đổi. Tai nghe vẫn sở hữu màu trắng quen thuộc và sẽ không có phiên bản màu khác cho người dùng lựa chọn.' }
]

const checkIsLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

/** HOME PAGE */
app.get('/', checkIsLoggedIn, (req, res) => {
    const message = req.flash('message');
    res.render('home', { products, message });
  });
  
  /** LOGIN PAGE */
  app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
      res.redirect('/');
    } else {
      res.render('login');
    }
  });
  
  app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (email === '') {
      res.render('login', {error: 'Vui lòng nhập email'});
    } else if (password === '') {
      res.render('login', {error: 'Vui lòng nhập password'});
    } else if (email === 'admin@gmail.com' && password === 'admin') {
      req.session.user = email;
      req.flash('message', 'Đăng nhập thành công');
      res.redirect('/');
    } else {
      res.render('login',{error: 'Sai email hoặc mật khẩu'});
    }
  });

/** ADD ITEM PAGE */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', upload.single('image'), (req, res) => {
    let name = req.body.name;
    let price = req.body.price;
    let mota = req.body.mota;
    let image = req.body.image;

    if (name === '' || price === '' || image === '') {
        res.render('add', { error: 'Vui lòng nhập đầy đủ thông tin' });
    } else {
        const uploadedImage = req.file;
        const imagePath = '/img/' + uploadedImage.filename;
        const newProduct = {
            id: products.length < 1 ? 1 : products[products.length - 1].id + 1,
            name: name,
            image: imagePath,
            price: parseFloat(price),
            mota: mota
        };
        products.push(newProduct);
        req.flash('message', 'Thêm sản phẩm mới thành công');
        res.redirect('/');
    }
});

/** UPDATE ITEM PAGE */
app.get('/edit/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(item => item.id === id);
    res.render('edit', { product });
});

app.post('/edit/:id', upload.single('image'), (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(product => product.id === id);
    let name = req.body.name;
    let price = req.body.price;
    let image = products[productIndex].image;
    let mota = req.body.mota;
    if(mota === ''){
        mota = products[productIndex].mota;
    }
  
    if (req.file) {
      const uploadedImage = req.file;
      const imagePath = '/img/' + uploadedImage.filename;
      image = imagePath;
    }
    if (productIndex !== -1) {
      products[productIndex] = {
        id: id,
        name: name,
        image: image,
        price: parseFloat(price),
        mota: mota
      };
      req.flash('message', 'Sửa sản phẩm thành công');
      res.redirect('/');
    }
});

/**DELETE */
app.post('/delete/:id', (req, res) => {
    const productIndex = products.findIndex(product => product.id === parseInt(req.params.id));
    products.splice(productIndex, 1);
    req.flash('message', 'Xóa sản phẩm thành công');
    res.redirect('/');
});

/**DETAIL */
app.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(item => item.id === id);
    res.render('detail', { product });
});

const port = 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// email: admin@gmail.com
// password: admin