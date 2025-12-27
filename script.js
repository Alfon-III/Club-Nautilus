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

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.getAttribute('data-group');
                const targetId = btn.getAttribute('data-target');

                // Select only elements within the same group
                const groupBtns = document.querySelectorAll(`.tab-btn[data-group="${group}"]`);
                const groupContents = document.querySelectorAll(`.tab-content[data-group="${group}"]`);

                // Remove active class from group members
                groupBtns.forEach(b => b.classList.remove('active'));
                groupContents.forEach(c => c.classList.remove('active'));

                // Activate clicked button and target
                btn.classList.add('active');
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
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

        // Function to get current slide width
        function getSlideWidth() {
            return carouselItems[0].clientWidth;
        }

        // Function to update carousel position
        function updateCarousel() {
            const size = getSlideWidth();
            carouselSlide.style.transform = 'translateX(' + (-size * counter) + 'px)';
        }

        // Initialize carousel after a short delay to allow Instagram embeds to load
        setTimeout(() => {
            updateCarousel();
        }, 500);

        // Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (counter >= carouselItems.length - 1) {
                    counter = 0; // Loop back to start
                } else {
                    counter++;
                }
                updateCarousel();
            });
        }

        // Previous button
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (counter <= 0) {
                    counter = carouselItems.length - 1; // Loop to end
                } else {
                    counter--;
                }
                updateCarousel();
            });
        }

        // Handle resize
        window.addEventListener('resize', () => {
            updateCarousel();
        });

        // Re-initialize when Instagram embeds finish loading
        window.addEventListener('load', () => {
            setTimeout(() => {
                updateCarousel();
            }, 1000);
        });
    }

    // Skip Section Button Logic
    const skipBtn = document.getElementById('skip-section-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            const sections = document.querySelectorAll('section');
            const currentScroll = window.scrollY;
            let nextSection = null;

            for (const section of sections) {
                // Add a small buffer (e.g. 100px) to consider "current" section vs "next"
                if (section.offsetTop > currentScroll + 100) {
                    nextSection = section;
                    break;
                }
            }

            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // If no next section (at the bottom), scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Hide button when at the top? Optional. Let's keep it generally visible but maybe hide at very top if needed.
        // For now, let's just make sure it's visible. 
        // We can add a scroll listener to toggle visibility if desired, but user didn't explicitly ask for it to hide.
        // However, a nice touch is to hide it when at the bottom-most point if it's "next section" only.
        // But looping to top is useful too.
    }
    // Contact Email Copy Functionality
    const copyEmailBtn = document.getElementById('copy-email-btn');
    const contactEmail = document.getElementById('contact-email');

    if (copyEmailBtn && contactEmail) {
        copyEmailBtn.addEventListener('click', () => {
            const emailText = contactEmail.innerText;

            navigator.clipboard.writeText(emailText).then(() => {
                // Success feedback
                const icon = copyEmailBtn.querySelector('i');
                const originalClass = icon.className;

                // Change icon to checkmark
                icon.className = 'fas fa-check';
                icon.style.color = 'var(--primary-red)';

                // Revert after 2 seconds
                setTimeout(() => {
                    icon.className = originalClass;
                    icon.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    }
});
