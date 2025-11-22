document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    }));

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(10, 25, 47, 0.95)';
            header.style.boxShadow = '0 10px 30px -10px rgba(2, 12, 27, 0.7)';
        } else {
            header.style.background = 'rgba(10, 25, 47, 0.85)';
            header.style.boxShadow = 'none';
        }
    });

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible'); // Use class for animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                btn.classList.add('active');
                const target = btn.getAttribute('data-target');
                document.getElementById(target).classList.add('active');
            });
        });
    }

    // Instagram Carousel Logic
    const carouselSlide = document.querySelector('.carousel-slide');
    const carouselItems = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (carouselSlide && carouselItems.length > 0) {
        let counter = 0;
        const size = carouselItems[0].clientWidth;

        // Initial position
        // carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)';

        nextBtn.addEventListener('click', () => {
            if (counter >= carouselItems.length - 1) {
                counter = -1; // Loop back to start
            }
            counter++;
            carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)';
        });

        prevBtn.addEventListener('click', () => {
            if (counter <= 0) {
                counter = carouselItems.length; // Loop to end
            }
            counter--;
            carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)';
        });

        // Auto-play carousel
        setInterval(() => {
            if (counter >= carouselItems.length - 1) {
                counter = -1;
            }
            counter++;
            carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)';
        }, 5000); // Change slide every 5 seconds

        // Handle resize
        window.addEventListener('resize', () => {
            const newSize = carouselItems[0].clientWidth;
            carouselSlide.style.transform = 'translateX(' + (-newSize * counter) + 'px)';
        });
    }
});
