import React, { useState, useEffect } from 'react';
import '../assets/css/main.css';
import { handleImageError } from '../utils/portfolioImageUtils';

const Landing = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Add scroll effect
    const handleScroll = () => {
      const sections = ['home', 'about', 'services', 'portfolio', 'team', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) {
        setActiveSection(current);
      }

      // Show/hide scroll top button
      const scrollTop = document.querySelector('.scroll-top');
      if (scrollTop) {
        if (window.scrollY > 100) {
          scrollTop.style.display = 'flex';
        } else {
          scrollTop.style.display = 'none';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e, target) => {
    e.preventDefault();
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileNavOpen(false);
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="index-page">
      {/* Header */}
      <header id="header" className="header d-flex align-items-center fixed-top">
        <div className="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
          <a href="#home" className="logo d-flex align-items-center">
            <img src="/assets/images/logo.png" alt="VikraHub" />
            <h1 className="sitename">VikraHub</h1>
          </a>

          <nav id="navmenu" className={`navmenu ${mobileNavOpen ? 'mobile-nav-active' : ''}`}>
            <ul>
              <li><a href="#home" onClick={(e) => handleSmoothScroll(e, '#home')} className={activeSection === 'home' ? 'active' : ''}>Home</a></li>
              <li><a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')} className={activeSection === 'about' ? 'active' : ''}>About</a></li>
              <li><a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')} className={activeSection === 'services' ? 'active' : ''}>Services</a></li>
              <li><a href="#portfolio" onClick={(e) => handleSmoothScroll(e, '#portfolio')} className={activeSection === 'portfolio' ? 'active' : ''}>Portfolio</a></li>
              <li><a href="#team" onClick={(e) => handleSmoothScroll(e, '#team')} className={activeSection === 'team' ? 'active' : ''}>Team</a></li>
              <li><a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact</a></li>
            </ul>
            <i 
              className="mobile-nav-toggle d-xl-none bi bi-list" 
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            ></i>
          </nav>
        </div>
      </header>

      <main className="main">
        {/* Hero Section */}
        <section id="home" className="hero section">
          <div className="container">
            <div className="row gy-4">
              <div className="col-lg-6 order-2 order-lg-1 d-flex flex-column justify-content-center" data-aos="zoom-out">
                <h1>Welcome to <span className="accent-color">VikraHub</span></h1>
                <p>We are a team of talented professionals providing innovative solutions for your business needs. From web development to digital marketing, we've got you covered.</p>
                <div className="d-flex">
                  <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')} className="btn-get-started">Get Started</a>
                  <a href="https://www.youtube.com/watch?v=Y7f98aduVJ8" className="glightbox btn-watch-video d-flex align-items-center">
                    <i className="bi bi-play-circle"></i><span>Watch Video</span>
                  </a>
                </div>
              </div>
              <div className="col-lg-6 order-1 order-lg-2 hero-img" data-aos="zoom-out" data-aos-delay="200">
                <img src="/assets/images/hero-img.svg" className="img-fluid animated" alt="VikraHub Hero" />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about section">
          <div className="container">
            <div className="row gy-4">
              <div className="col-lg-6 content" data-aos="fade-up" data-aos-delay="100">
                <p className="who-we-are">Who We Are</p>
                <h3>Unleashing potential with innovative solutions</h3>
                <p>
                  At VikraHub, we believe in the power of technology to transform businesses and create meaningful impact. 
                  Our team combines creativity, technical expertise, and strategic thinking to deliver exceptional results.
                </p>
                <ul>
                  <li><i className="bi bi-check-circle"></i> <span>Expert team of developers and designers</span></li>
                  <li><i className="bi bi-check-circle"></i> <span>Proven track record of successful projects</span></li>
                  <li><i className="bi bi-check-circle"></i> <span>Customer-centric approach to every solution</span></li>
                </ul>
                <a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')} className="read-more"><span>Read More</span><i className="bi bi-arrow-right"></i></a>
              </div>
              <div className="col-lg-6 about-images" data-aos="fade-up" data-aos-delay="200">
                <div className="row gy-4">
                  <div className="col-lg-6">
                    <img src="/assets/images/about/about-company-1.jpg" className="img-fluid" alt="" />
                  </div>
                  <div className="col-lg-6">
                    <div className="row gy-4">
                      <div className="col-lg-12">
                        <img src="/assets/images/about/about-company-2.jpg" className="img-fluid" alt="" />
                      </div>
                      <div className="col-lg-12">
                        <img src="/assets/images/about/about-company-3.jpg" className="img-fluid" alt="" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="services section light-background">
          <div className="container section-title" data-aos="fade-up">
            <h2>Services</h2>
            <p>Check our Services</p>
          </div>
          <div className="container">
            <div className="row g-5">
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
                <div className="service-item item-cyan position-relative">
                  <i className="bi bi-activity icon"></i>
                  <div>
                    <h3>Web Development</h3>
                    <p>Custom web applications built with modern technologies like React, Django, and more. We create responsive, scalable solutions.</p>
                    <a href="#contact" className="read-more stretched-link">Learn More <i className="bi bi-arrow-right"></i></a>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="200">
                <div className="service-item item-orange position-relative">
                  <i className="bi bi-broadcast icon"></i>
                  <div>
                    <h3>Digital Marketing</h3>
                    <p>Comprehensive digital marketing strategies to boost your online presence and drive business growth.</p>
                    <a href="#contact" className="read-more stretched-link">Learn More <i className="bi bi-arrow-right"></i></a>
                  </div>
                </div>
              </div>

              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="300">
                <div className="service-item item-teal position-relative">
                  <i className="bi bi-easel icon"></i>
                  <div>
                    <h3>UI/UX Design</h3>
                    <p>Beautiful, intuitive designs that provide exceptional user experiences and drive engagement.</p>
                    <a href="#contact" className="read-more stretched-link">Learn More <i className="bi bi-arrow-right"></i></a>
                  </div>
                </div>
              </div>

              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="400">
                <div className="service-item item-red position-relative">
                  <i className="bi bi-bounding-box-circles icon"></i>
                  <div>
                    <h3>Mobile Development</h3>
                    <p>Native and cross-platform mobile applications that deliver seamless user experiences.</p>
                    <a href="#contact" className="read-more stretched-link">Learn More <i className="bi bi-arrow-right"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="portfolio" className="portfolio section">
          <div className="container section-title" data-aos="fade-up">
            <h2>Portfolio</h2>
            <p>Check our latest work</p>
          </div>
          <div className="container">
            <div className="isotope-layout" data-default-filter="*" data-layout="masonry" data-sort="original-order">
              <ul className="portfolio-filters isotope-filters" data-aos="fade-up" data-aos-delay="100">
                <li data-filter="*" className="filter-active">All</li>
                <li data-filter=".filter-app">App</li>
                <li data-filter=".filter-product">Product</li>
                <li data-filter=".filter-branding">Branding</li>
                <li data-filter=".filter-books">Books</li>
              </ul>
              
              <div className="row gy-4 isotope-container" data-aos="fade-up" data-aos-delay="200">
                <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-app">
                  <div className="portfolio-content h-100">
                    <img 
                      src="/assets/images/portfolio/app-1.jpg" 
                      className="img-fluid" 
                      alt="App Portfolio Sample"
                      onError={handleImageError}
                    />
                    <div className="portfolio-info">
                      <h4>App 1</h4>
                      <p>Lorem ipsum, dolor sit amet consectetur</p>
                      <a href="/assets/images/portfolio/app-1.jpg" title="App 1" data-gallery="portfolio-gallery-app" className="glightbox preview-link"><i className="bi bi-zoom-in"></i></a>
                      <a href="portfolio-details.html" title="More Details" className="details-link"><i className="bi bi-link-45deg"></i></a>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-product">
                  <div className="portfolio-content h-100">
                    <img 
                      src="/assets/images/portfolio/product-1.jpg" 
                      className="img-fluid" 
                      alt="Product Portfolio Sample"
                      onError={handleImageError}
                    />
                    <div className="portfolio-info">
                      <h4>Product 1</h4>
                      <p>Lorem ipsum, dolor sit amet consectetur</p>
                      <a href="/assets/images/portfolio/product-1.jpg" title="Product 1" data-gallery="portfolio-gallery-product" className="glightbox preview-link"><i className="bi bi-zoom-in"></i></a>
                      <a href="portfolio-details.html" title="More Details" className="details-link"><i className="bi bi-link-45deg"></i></a>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4 col-md-6 portfolio-item isotope-item filter-branding">
                  <div className="portfolio-content h-100">
                    <img 
                      src="/assets/images/portfolio/branding-1.jpg" 
                      className="img-fluid" 
                      alt="Branding Portfolio Sample"
                      onError={handleImageError}
                    />
                    <div className="portfolio-info">
                      <h4>Branding 1</h4>
                      <p>Lorem ipsum, dolor sit amet consectetur</p>
                      <a href="/assets/images/portfolio/branding-1.jpg" title="Branding 1" data-gallery="portfolio-gallery-branding" className="glightbox preview-link"><i className="bi bi-zoom-in"></i></a>
                      <a href="portfolio-details.html" title="More Details" className="details-link"><i className="bi bi-link-45deg"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="team section">
          <div className="container section-title" data-aos="fade-up">
            <h2>Team</h2>
            <p>Our hard working team</p>
          </div>
          <div className="container">
            <div className="row gy-4">
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
                <div className="team-member d-flex align-items-start">
                  <div className="pic"><img src="/assets/images/person/person_1.jpg" className="img-fluid" alt="" /></div>
                  <div className="member-info">
                    <h4>Walter White</h4>
                    <span>Chief Executive Officer</span>
                    <p>Explicabo voluptatem mollitia et repellat qui dolorum quasi</p>
                    <div className="social">
                      <a href=""><i className="bi bi-twitter-x"></i></a>
                      <a href=""><i className="bi bi-facebook"></i></a>
                      <a href=""><i className="bi bi-instagram"></i></a>
                      <a href=""> <i className="bi bi-linkedin"></i> </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="200">
                <div className="team-member d-flex align-items-start">
                  <div className="pic"><img src="/assets/images/person/person_2.jpg" className="img-fluid" alt="" /></div>
                  <div className="member-info">
                    <h4>Sarah Johnson</h4>
                    <span>Product Manager</span>
                    <p>Aut maiores voluptates amet et quis praesentium qui senda para</p>
                    <div className="social">
                      <a href=""><i className="bi bi-twitter-x"></i></a>
                      <a href=""><i className="bi bi-facebook"></i></a>
                      <a href=""><i className="bi bi-instagram"></i></a>
                      <a href=""> <i className="bi bi-linkedin"></i> </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact section">
          <div className="container section-title" data-aos="fade-up">
            <h2>Contact</h2>
            <p>Contact Us</p>
          </div>
          <div className="container" data-aos="fade-up" data-aos-delay="100">
            <div className="row gy-4">
              <div className="col-lg-6">
                <div className="row gy-4">
                  <div className="col-md-6">
                    <div className="info-item" data-aos="fade" data-aos-delay="200">
                      <i className="bi bi-geo-alt"></i>
                      <h3>Address</h3>
                      <p>A108 Adam Street</p>
                      <p>New York, NY 535022</p>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="info-item" data-aos="fade" data-aos-delay="300">
                      <i className="bi bi-telephone"></i>
                      <h3>Call Us</h3>
                      <p>+1 5589 55488 55</p>
                      <p>+1 6678 254445 41</p>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="info-item" data-aos="fade" data-aos-delay="400">
                      <i className="bi bi-envelope"></i>
                      <h3>Email Us</h3>
                      <p>info@example.com</p>
                      <p>contact@example.com</p>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="info-item" data-aos="fade" data-aos-delay="500">
                      <i className="bi bi-clock"></i>
                      <h3>Open Hours</h3>
                      <p>Monday - Friday</p>
                      <p>9:00AM - 05:00PM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6">
                <form action="forms/contact.php" method="post" className="php-email-form" data-aos="fade-up" data-aos-delay="200">
                  <div className="row gy-4">
                    <div className="col-md-6">
                      <input type="text" name="name" className="form-control" placeholder="Your Name" required="" />
                    </div>
                    
                    <div className="col-md-6">
                      <input type="email" className="form-control" name="email" placeholder="Your Email" required="" />
                    </div>
                    
                    <div className="col-12">
                      <input type="text" className="form-control" name="subject" placeholder="Subject" required="" />
                    </div>
                    
                    <div className="col-12">
                      <textarea className="form-control" name="message" rows="6" placeholder="Message" required=""></textarea>
                    </div>
                    
                    <div className="col-12 text-center">
                      <div className="loading">Loading</div>
                      <div className="error-message"></div>
                      <div className="sent-message">Your message has been sent. Thank you!</div>
                      <button type="submit">Send Message</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="footer">
        <div className="container footer-top">
          <div className="row gy-4">
            <div className="col-lg-4 col-md-6 footer-about">
              <a href="#home" className="d-flex align-items-center">
                <span className="sitename">VikraHub</span>
              </a>
              <div className="footer-contact pt-3">
                <p>A108 Adam Street</p>
                <p>New York, NY 535022</p>
                <p className="mt-3"><strong>Phone:</strong> <span>+1 5589 55488 55</span></p>
                <p><strong>Email:</strong> <span>info@example.com</span></p>
              </div>
            </div>
            
            <div className="col-lg-2 col-md-3 footer-links">
              <h4>Useful Links</h4>
              <ul>
                <li><i className="bi bi-chevron-right"></i> <a href="#home">Home</a></li>
                <li><i className="bi bi-chevron-right"></i> <a href="#about">About us</a></li>
                <li><i className="bi bi-chevron-right"></i> <a href="#services">Services</a></li>
                <li><i className="bi bi-chevron-right"></i> <a href="#portfolio">Portfolio</a></li>
              </ul>
            </div>
            
            <div className="col-lg-2 col-md-3 footer-links">
              <h4>Our Services</h4>
              <ul>
                <li><i className="bi bi-chevron-right"></i> <a href="#">Web Design</a></li>
                <li><i className="bi bi-chevron-right"></i> <a href="#">Web Development</a></li>
                <li><i className="bi bi-chevron-right"></i> <a href="#">Product Management</a></li>
                <li><i className="bi bi-chevron-right"></i> <a href="#">Marketing</a></li>
              </ul>
            </div>
            
            <div className="col-lg-4 col-md-12">
              <h4>Follow Us</h4>
              <p>Cras fermentum odio eu feugiat lide par naso tierra videa magna derita valies</p>
              <div className="social-links d-flex">
                <a href=""><i className="bi bi-twitter-x"></i></a>
                <a href=""><i className="bi bi-facebook"></i></a>
                <a href=""><i className="bi bi-instagram"></i></a>
                <a href=""><i className="bi bi-linkedin"></i></a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container copyright text-center mt-4">
          <p>© <span>Copyright</span> <strong className="px-1 sitename">VikraHub</strong> <span>All Rights Reserved</span></p>
          <div className="credits">
            Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>
          </div>
        </div>
      </footer>

      {/* Scroll Top */}
      <a href="#" onClick={scrollToTop} className="scroll-top d-flex align-items-center justify-content-center"><i className="bi bi-arrow-up-short"></i></a>
    </div>
  );
};

export default Landing;
