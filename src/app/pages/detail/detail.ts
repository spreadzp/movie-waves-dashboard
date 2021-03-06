import { Component, ViewEncapsulation } from '@angular/core';

import { Movie } from '../../models/movie.model';

import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

import { YoutubeApiService } from '../../providers/youtube-api-service';

import { Plugins, Capacitor } from '@capacitor/core';

import { ModalController } from '@ionic/angular';
import { YoutubeModalComponent } from '../../modals/youtube-modal/youtube.modal';
import { CommentModalComponent } from '../../modals/comment-modal/comment.modal';
import { ShowCommentsModalComponent } from '../../modals/show-comments-modal/show.comments.modal';
import { ShowActorsModalComponent } from './../../modals/show-actors-modal/show.actors.modal';

import { LikeMovie, FavoriteMovie } from '../../store/actions/movies.actions';
import { MovieState } from '../../store/state/movies.state';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import { IziToastService } from '../../providers/izi-toast.service';
import { WavesService } from '../../providers/waves-service';

@Component({
  selector: 'app-page-detail',
  templateUrl: './detail.html',
  styleUrls: ['./detail.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DetailComponent {

  currentYear = new Date().getFullYear();
  selectedMovie: Observable<Movie>;
  movie: Movie;
  genreImages: string[] = ['action', 'comedy', 'crime', 'documentary', 'drama', 'fantasy', 'film noir',
                           'horror', 'romance', 'science fiction', 'westerns', 'animation', 'food'];

  constructor(private store: Store, private youtubeApiService: YoutubeApiService, private modalCtrl: ModalController,
              private activatedRoute: ActivatedRoute, private iziToast: IziToastService, private wavesService: WavesService) {
  }

  ionViewWillEnter() {
    // console.log('ionViewWillEnter');

    /*
    this.selectedMovie = this.store.select(state => state.catalog.selectedMovie);

    this.selectedMovie.subscribe(
      data => {
          // console.log(data);
          this.movie = data;
          if (this.movie !== null) {
            const genre = this.movie.genre.toLowerCase().split(',', 1)[0];
            if (this.genreImages.indexOf(genre) !== -1) {
              this.movie.genreImage = 'assets/movies-genres/' + genre + '.png';
            }
          }
      },
      error => {
          console.log(<any>error);
      }
    );
    */
   const id = this.activatedRoute.snapshot.paramMap.get('id');
   this.getMovieDetails(id);
  }

  getMovieDetails(id: string) {
    this.selectedMovie = this.store.select(MovieState.movieById).pipe(map(filterFn => filterFn(id)));
    this.selectedMovie.subscribe(movie => {
      console.log(movie);
      this.movie = movie;
      if (this.movie !== null) {
        const genre = this.movie.genre.toLowerCase().split(',', 1)[0];
        if (this.genreImages.indexOf(genre) !== -1) {
          this.movie.genreImage = 'assets/movies-genres/' + genre + '.png';
        }
      }
    });
  }

  watchTrailer() {
    console.log('DetailsPage::watchTrailer | method called');

    // Code to use Youtube Api Service: providers/youtube-api-service.ts
    this.youtubeApiService.searchMovieTrailer(this.movie.title)
    .subscribe(result => {
      if (result.items.length > 0) {
        console.log(result);
        const { videoId } = result.items[0].id;
        this.movie.videoId = videoId;

        // Code to use capacitor-youtube-player plugin.
        console.log('DetailsPage::watchTrailer -> platform: ' + Capacitor.platform);
        if (Capacitor.platform === 'web') {
          const componentProps = { modalProps: { item: this.movie}};
          this.presentModal(componentProps, YoutubeModalComponent);
        } else { // Native
          this.testYoutubePlayerPlugin();
        }

        /*
        if (Capacitor.platform === 'web') {
          window.open('https://www.youtube.com/watch?v=' + videoId);
        } else { // TODO: Use capacitor-youtube-player plugin.
          window.open('https://www.youtube.com/watch?v=' + videoId, '_blank');
        }
        */
      }
    },
    error => {
      this.iziToast.show('Watch Trailer', 'Sorry, an error has occurred.', 'red', 'ico-error', 'assets/avatar.png');
    });

  }

  async presentModal(componentProps: any, component) {
    console.log('DetailsPage::presentModal | method called -> movie', this.movie);
    // const componentProps = { modalProps: { item: this.movie}};
    const modal = await this.modalCtrl.create({
      component: component,
      componentProps: componentProps
    });
    await modal.present();

    const {data} = await modal.onWillDismiss();
    if (data) {
      console.log('data', data);
    }
  }

  async testYoutubePlayerPlugin() {

    const { YoutubePlayer } = Plugins;

    const result = await YoutubePlayer.echo({value: 'hola' });
    console.log('result', result);

    const options = {width: 640, height: 360, videoId: this.movie.videoId};
    const playerReady = await YoutubePlayer.initialize(options);
  }

  onClickLike() {
    console.log('DetailsPage::onClickLike');
    console.log(this.movie);
    if (typeof this.movie.likes === 'undefined') {
      this.movie.likes = 0;
    }
    console.log(this.movie.likes);
    this.movie.likes += 1;
    this.store.dispatch(new LikeMovie(this.movie));
  }

  onClickComment() {
    console.log('DetailsPage::onClickComment');
    const componentProps = { modalProps: { title: 'Comment', movie: this.movie}};
    this.presentModal(componentProps, CommentModalComponent);
  }

  onClickShowComment() {
    console.log('DetailsPage::onClickShowComment');
    const componentProps = { modalProps: { title: 'Comments', movie: this.movie}};
    this.presentModal(componentProps, ShowCommentsModalComponent);
  }

  onClickFavorite() {
    console.log('DetailsPage::onClickFavorite');

    if (typeof localStorage.getItem('@@STATE') !== 'undefined') {
      const state = JSON.parse(localStorage.getItem('@@STATE'));
      const favorites = state.catalog.favorites;

      if (typeof favorites !== 'undefined') {

        const exist = favorites.filter(item => {
          return item.title === this.movie.title;
        });

        if (exist.length === 0) {
          this.store.dispatch(
            new FavoriteMovie(this.movie)).subscribe(() => {
            this.iziToast.success('Favorite movie', 'Favorite Movie added.');
          });
        } else {
          this.iziToast.show('Favorite movie', 'The movie has already been added.', 'red', 'ico-error', 'assets/avatar.png');
        }
      }
    }
  }

  onClickShare() {
    console.log('DetailsPage::onClickShare');
    if (navigator['share']) {
      navigator['share']({
        title: 'WebShare API Demo',
        url: 'https://codepen.io/ayoisaiah/pen/YbNazJ'
      }).then(() => {
        console.log('Thanks for sharing!');
      })
      .catch(console.error);
    } else {
      // fallback
    }
  }

  showActors() {
    console.log('DetailsPage::showActors | method called');
    const componentProps = { modalProps: { actors: this.movie.cast}};
    this.presentModal(componentProps, ShowActorsModalComponent);
  }

  makeBit() {
    return this.wavesService.login();
  }
}
